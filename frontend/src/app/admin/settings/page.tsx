"use client";

import { useState } from "react";
import {
  FiSave,
  FiGlobe,
  FiMail,
  FiLock,
  FiShield,
} from "react-icons/fi";

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState("SmartComputers.ke");
  const [currency, setCurrency] = useState("KES");
  const [email, setEmail] = useState("admin@smartcomputers.ke");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      title: "General",
      icon: FiGlobe,
      fields: (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Store Name
            </label>
            <input
              className="input"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Default Currency
            </label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="TZS">TZS - Tanzanian Shilling</option>
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="AED">AED - UAE Dirham</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      title: "Notifications",
      icon: FiMail,
      fields: (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Admin Email
            </label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="orderNotify" defaultChecked className="h-4 w-4" />
            <label htmlFor="orderNotify" className="text-sm text-slate-600 dark:text-slate-300">
              Notify on new orders
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="lowStockNotify" defaultChecked className="h-4 w-4" />
            <label htmlFor="lowStockNotify" className="text-sm text-slate-600 dark:text-slate-300">
              Notify on low stock
            </label>
          </div>
        </div>
      ),
    },
    {
      title: "Security",
      icon: FiShield,
      fields: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" id="2fa" className="h-4 w-4" />
            <label htmlFor="2fa" className="text-sm text-slate-600 dark:text-slate-300">
              Enable two-factor authentication
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="sessionTimeout" defaultChecked className="h-4 w-4" />
            <label htmlFor="sessionTimeout" className="text-sm text-slate-600 dark:text-slate-300">
              Auto-logout after inactivity
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Settings UI is a preview. Backend configuration updates coming soon.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary dark:text-white">
        Settings
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage store configuration
      </p>

      <form onSubmit={handleSave}>
        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-semibold text-secondary dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="mt-4">{section.fields}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            <FiLock className="mr-1 inline h-4 w-4" />
            Settings are stored locally for preview
          </p>
          <button type="submit" className="btn-primary">
            <FiSave className="h-4 w-4" />
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

