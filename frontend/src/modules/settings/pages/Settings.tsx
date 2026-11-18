/**
 * 系统设置页面（聚合 tab 页）
 *
 * 从原 infra/pages/Settings.tsx 抽离（2026-07-08 增量-12 P1-6 frontend 同步）。
 * 包含 5 个子 tab：models / qanything / notifications / database / security
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Database, Shield, Brain, BookOpen, Network } from 'lucide-react';
import clsx from 'clsx';
import ModelSettings from './settings/ModelSettings';
import NotificationSettings from '../../notification/pages/NotificationSettings';
import BackupSettings from '../../backup/pages/BackupSettings';
import SecuritySettings from './settings/SecuritySettings';
import GeneralSettings from './settings/GeneralSettings';
import QAnythingSettings from './settings/QAnythingSettings';
import ITopSyncSettings from './settings/ITopSyncSettings';

interface TabDef {
  id: string;
  name: string;
  icon: typeof Brain;
}

export default function Settings() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('models');

  // 如果是强制修改密码，自动切换到安全设置标签
  useEffect(() => {
    if (searchParams.get('changePassword') === 'true') {
      setActiveTab('security');
    }
  }, [searchParams]);

  const tabs: TabDef[] = [
    { id: 'models', name: t('settings.models'), icon: Brain },
    { id: 'qanything', name: t('dashboard.knowledge'), icon: BookOpen },
    { id: 'notifications', name: t('settings.monitoring'), icon: Bell },
    { id: 'database', name: t('settings.backup'), icon: Database },
    { id: 'itop', name: 'iTop CMDB', icon: Network },
    { id: 'security', name: t('settings.security'), icon: Shield },
  ];

  return (
    <div className="h-full overflow-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t('settings.title')}</h1>
          <p className="text-text-secondary">{t('settings.languageDesc')}</p>
        </div>

        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex">
            {/* Left Navigation */}
            <div className="w-64 border-r border-border p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-text-secondary hover:bg-background'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Content */}
            <div className="flex-1 p-6">
              {activeTab === 'models' && <ModelSettings />}
              {activeTab === 'qanything' && <QAnythingSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'database' && <BackupSettings />}
              {activeTab === 'itop' && <ITopSyncSettings />}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </h3>
                    <p className="text-sm text-text-secondary mb-6">Configure security policies and access control</p>
                  </div>
                  <SecuritySettings />
                  <GeneralSettings />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Community & WeChat Groups */}
        <CommunitySection />
      </div>
    </div>
  );
}

/** 社区 & 微信群信息区块 */
function CommunitySection() {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="relative p-6">
        {/* WeChat Business Card — Top Right */}
        <div className="absolute top-10 right-5 flex flex-col items-center z-10">
          <img
            src="/wechaterweima.png"
            alt="WeChat official account card"
            className="rounded-md"
            style={{ width: '560px', height: 'auto', objectFit: 'contain' }}
          />
          <span className="text-sm text-text-muted mt-4 text-center leading-tight">
            Scan the QR code to follow the official account and join the project communication group
          </span>
        </div>

        {/* Title + Intro — Avoid right-side business card */}
        <h3 className="text-lg font-semibold text-text-primary mb-1 pr-[600px]">Join the Community</h3>
        <p className="text-sm text-text-secondary mb-4 pr-[600px]">
          Gathered by interest and passion, building a user-friendly open-source AI IT operations platform together
        </p>

        {/* Upper Short Info — Avoid right-side business card */}
        <div className="text-sm text-text-secondary leading-relaxed space-y-2 mb-4 pr-[600px]">
          <p>
            👋 Welcome to join <span className="text-text-primary font-medium">AIOps Agent Platform</span> project group, latest code is in{' '}
            <code className="bg-bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dev</code> branch.
          </p>
          <div className="space-y-1">
            <p>
              ✨ Online Demo:
              <a href="https://agentdemo-0mwug01t6.maozi.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                agentdemo-0mwug01t6.maozi.io
              </a>
            </p>
            <p>
              📚 Documentation Manual:
              <a href="https://aiopsdoc-0mwug01t6.maozi.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                aiopsdoc-0mwug01t6.maozi.io
              </a>
            </p>
          </div>
        </div>

        {/* Lower Long Content — Avoid right-side business card */}
        <div className="text-sm text-text-secondary leading-relaxed space-y-3 pr-[600px]">
          <div>
            <p className="text-text-primary font-medium mb-1">💡 Why We Started</p>
            <p>
              The original intention of developing this project is not for profit, but to liberate IT operations. Taking advantage of the AI
              wave, truly implement AI
              and IT operations scenarios, helping everyone get rid of tedious, repetitive, and meaningless work. Creating a truly easy-to-use, problem-solving free open-source platform so that everyone can spend more time with family and do more of what they truly love.
            </p>
            <p className="mt-2 text-orange-600 dark:text-orange-400 font-medium">
              ⚠️ Notice: Closed-source secondary development, packaged sales, SaaS operations, and other commercial uses are not allowed. Promised to be permanently open source!
            </p>
          </div>

          <div className="space-y-1">
            <p>💡 All ideas, suggestions, requests, and bugs go here:</p>
            <p>
              <a href="https://github.com/qinshihu/itops-agent-platform/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                github.com/qinshihu/itops-agent-platform/issues
              </a>
            </p>
          </div>

          <div className="space-y-1 text-text-muted">
            <p>
              • All secondary development should be based on the latest <code className="bg-bg-muted px-1 py-0.5 rounded text-xs font-mono">dev</code> branch, unifying APIs and UI style
            </p>
            <p>• Submit all requests, bugs, and suggestions in GitHub Issues; the group chat is for discussion only</p>
            <p>• Contribute code: Fork repo → develop → open PR</p>
          </div>

          <p className="text-text-muted italic">
            Every line of code, every feedback, every suggestion makes this project better. We have never met, but we can create valuable and meaningful things together based on common ideas driven by interest and passion. Learn and grow, do one thing well, looking forward to the participation of every peer!
          </p>
        </div>
      </div>
    </div>
  );
}
