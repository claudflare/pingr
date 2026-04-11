const { Menu, safeStorage, dialog, BrowserWindow } = require('electron/main');

const fs = require('node:fs');

const autoLauncher = require('./autolauncher');
const { loadConfig, writeConfig } = require('./config');
const { resetTasksFile, exportTasks } = require('./tasks');
const i18n = require('./i18n');

function switchLanguage(locale) {
  if (!i18n.getLocales().includes(locale)) return;
  i18n.setLocale(locale);
  const config = loadConfig();
  config.language = locale;
  writeConfig(config);
  createMenu();
  const win = BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('locale-changed', locale);
}

function createMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [{ role: 'appMenu' }]
      : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'options',
      label: i18n.__('menu.settings'),
      submenu: [
        {
          label: i18n.__('menu.autoLaunch'),
          type: 'checkbox',
          checked: autoLauncher.getAutoLaunchStatus(),
          click: async () => {
            await autoLauncher.toggleAutoLaunch();
          },
        },
        {
          type: 'separator',
        },
        {
          label: i18n.__('menu.encryptData'),
          type: 'checkbox',
          checked: safeStorage.isEncryptionAvailable() && loadConfig().useEncryption,
          click: async () => {
            const config = loadConfig();
            config.useEncryption = !config.useEncryption;
            await writeConfig(config);
          },
        },
        {
          label: i18n.__('menu.exportTasks'),
          click: () => {
            const tasks = exportTasks();
            dialog.showSaveDialog({
              title: i18n.__('menu.exportTasks'),
              defaultPath: 'tasks.json',
            }).then((result) => {
              if (!result.canceled && result.filePath) {
                fs.writeFileSync(result.filePath, tasks);
              }
            });
          },
        },
        {
          type: 'separator',
        },
        {
          label: i18n.__('menu.resetTasks'),
          click: resetTasksFile,
        },
        {
          type: 'separator',
        },
        {
          label: i18n.__('menu.language'),
          submenu: [
            {
              label: 'English',
              type: 'radio',
              checked: i18n.getLocale() === 'en',
              click: () => switchLanguage('en'),
            },
            {
              label: 'Français',
              type: 'radio',
              checked: i18n.getLocale() === 'fr',
              click: () => switchLanguage('fr'),
            },
          ],
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

module.exports = { createMenu };

createMenu();