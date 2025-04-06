'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const tabs = [
  { id: 1, text: 'Dashboard' },
  { id: 2, text: 'Info' },
  { id: 3, text: 'Settings' },
];

export const ExclusionTabs = () => {
  const [activeTab, setActiveTab] = useState<number>(tabs[0].id);

  return (
    <nav className='space-x-2'>
      {tabs.map(tab => (
        <button
          onClick={() => setActiveTab(tab.id)}
          key={tab.id}
          type='button'
          className='transition relative rounded-full px-2 py-1 text-sm text-primary'
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId='click-pill'
              className='absolute inset-0 z-10 bg-primary mix-blend-difference'
              style={{ borderRadius: 9999 }}
              transition={{ type: 'spring', duration: 0.6 }}
            ></motion.span>
          )}
          {tab.text}
        </button>
      ))}
    </nav>
  );
};
