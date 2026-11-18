import type { Request, Response } from 'express';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { userCrudService } from '../services/userCrudService';
import { createAuditLog } from '../../audit/services/auditService';
import { env } from '../../../utils/env';
import { tokenBlacklist } from '../services/tokenBlacklist';
import { logger } from '../../../utils/logger';
import { validateBody } from '../../../middleware/validation';
import { authSchemas } from '../../../shared/schemas/apiValidation';
import { authenticateToken, invalidateUserCache } from '../../../middleware/auth';
import { validatePassword } from '../../../utils/passwordPolicy';
import {
  checkLoginLockout,
  recordFailedLogin,
  resetFailedLoginAttempts,
} from '../services/loginThrottler';

const router = Router();

// 登录
router.post('/login', validateBody(authSchemas.login), async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const lockoutStatus = checkLoginLockout(username);
    if (lockoutStatus.locked) {
      const remainingMinutes = Math.ceil(
        (lockoutStatus.lockoutUntil!.getTime() - new Date().getTime()) / 60000,
      );
      return res.status(423).json({
        success: false,
        message: `账户已被锁定，请${remainingMinutes}分钟后再试`,
      });
    }

    const user = userCrudService.getForAuth(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect username or password',
      });
    }

    if (!user.enabled) {
      return res.status(403).json({
        success: false,
        message: 'Account has been disabled',
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const result = recordFailedLogin(username);
      if (result.locked) {
        return res.status(423).json({
          success: false,
          message: `Too many incorrect password attempts, account locked for 30 minutes`,
        });
      }
      return res.status(401).json({
        success: false,
        message: `用户名或密码错误，剩余${result.remainingAttempts}次尝试机会`,
      });
    }

    resetFailedLoginAttempts(user.id);

    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as SignOptions,
    );

    const refreshToken = jwt.sign({ id: user.id, type: 'refresh' }, env.JWT_SECRET, {
      expiresIn: '7d',
    } as SignOptions);

    userCrudService.touchLogin(user.id);

    createAuditLog({
      user_id: user.id,
      action: 'login',
      resource_type: 'auth',
      resource_id: 'login',
      details: { username } as any,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          passwordMustChange: Boolean(user.password_must_change),
        },
      },
    });
  } catch (error) {
    logger.error('Login failed', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// 刷新token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide refresh token',
      });
    }

    if (tokenBlacklist.isBlacklisted(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & { id: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const user = userCrudService.getForWebSocket(decoded.id);

    if (!user?.enabled) {
      return res.status(401).json({
        success: false,
        message: 'User does not exist or has been disabled',
      });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role, email: user.email },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN } as SignOptions,
    );

    const newRefreshToken = jwt.sign({ id: user.id, type: 'refresh' }, env.JWT_SECRET, {
      expiresIn: '7d',
    } as SignOptions);

    tokenBlacklist.addToBlacklist(refreshToken, 'token-refresh', decoded.id);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired or is invalid',
      });
    }
    logger.error('Token refresh failed', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// 获取当前用户信息
router.get(
  '/me',
  authenticateToken,
  async (req: Request & { user?: { id: string } }, res: Response) => {
    try {
      const user = userCrudService.getProfile(req.user!.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User does not exist',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  },
);

// 退出登录
router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 将token加入黑名单
      tokenBlacklist.addToBlacklist(
        token,
        'user-logout',
        (req as { user?: { id: string } }).user?.id,
      );
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout failed', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout',
    });
  }
});

// 修改密码
router.post(
  '/change-password',
  authenticateToken,
  async (req: Request & { user?: { id: string } }, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current and new passwords',
        });
      }

      // 查询用户
      const user = userCrudService.getUserById(req.user!.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User does not exist',
        });
      }

      // 验证当前密码
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password incorrect',
        });
      }

      // 密码强度检查
      const passwordCheck = validatePassword(newPassword);
      if (!passwordCheck.valid) {
        return res.status(400).json({
          success: false,
          message: passwordCheck.message,
        });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // 更新密码并清除 password_must_change 标志
      userCrudService.updatePassword(user.id, hashedNewPassword);

      // 清除用户缓存，确保下一次请求获取最新状态
      invalidateUserCache(user.id);

      // 记录审计日志
      createAuditLog({
        user_id: user.id,
        action: 'change_password',
        resource_type: 'auth',
        resource_id: 'password',
        details: { username: user.username } as any,
        ip_address: req.ip,
      });

      logger.info(`用户 ${user.username} 修改了密码`);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      logger.error('Failed to change password', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  },
);

export default router;
