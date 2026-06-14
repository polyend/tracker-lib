/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
  name: 'Polyend Tracker Library',
  readme: 'documents/readme.md',
  projectDocuments: [],
  includeHierarchySummary: false,
  includeVersion: true,
  navigation: {
    includeCategories: false,
    includeGroups: true,
    includeFolders: true,
    compactFolders: true,
    excludeReferences: true,
  },
  categorizeByGroup: true,
  hideGenerator: true,
  plugin: ['typedoc-plugin-rename-defaults', 'typedoc-plugin-mdn-links'],
  out: 'docs',
};

export default config;
