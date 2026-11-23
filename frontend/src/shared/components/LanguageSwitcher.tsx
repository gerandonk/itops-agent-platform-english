import React from 'react';
import { Dropdown } from 'antd';
import { Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import { Globe, Check } from 'lucide-react';

const { Text } = Typography;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language || 'en';
  const label = currentLang === 'zh-CN' ? '中文' : 'English';

  const items: MenuProps['items'] = [
    {
      key: 'en',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text>{label}</Text>
          {currentLang === 'en' && <Check size={12} color="#1677ff" />}
        </div>
      ),
      onClick: () => {
        i18n.changeLanguage('en');
        localStorage.setItem('itops-lang', 'en');
      },
    },
    {
      key: 'zh-CN',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text>{currentLang === 'zh-CN' ? <Check size={12} color="#1677ff" /> : ''}</Text>
          <span>中文</span>
        </div>
      ),
      onClick: () => {
        i18n.changeLanguage('zh-CN');
        localStorage.setItem('itops-lang', 'zh-CN');
      },
    },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        className="p-1 rounded-lg hover:bg-slate-700/50 cursor-pointer"
        title="Switch Language"
      >
        <Globe size={16} color={currentLang === 'zh-CN' ? '#1677ff' : undefined} />
      </button>
    </Dropdown>
  );
}