import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'schema-gen',
  description:
    'High-performance OpenAPI to TypeScript/React Query/Vue Query code generation, powered by Rust',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'schema-gen' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'High-performance OpenAPI to TypeScript/React Query/Vue Query code generation, powered by Rust',
      },
    ],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'API', link: '/api/' },
      {
        text: 'Packages',
        items: [
          {
            text: '@schema-gen/core',
            link: 'https://npmjs.com/package/@schema-gen/core',
          },
          {
            text: '@schema-gen/cli',
            link: 'https://npmjs.com/package/@schema-gen/cli',
          },
          {
            text: '@schema-gen/plugin-sdk',
            link: 'https://npmjs.com/package/@schema-gen/plugin-sdk',
          },
          {
            text: '@schema-gen/plugin-react-query-v5',
            link: 'https://npmjs.com/package/@schema-gen/plugin-react-query-v5',
          },
          {
            text: '@schema-gen/plugin-vue-query-v4',
            link: 'https://npmjs.com/package/@schema-gen/plugin-vue-query-v4',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is schema-gen?', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'CLI Commands', link: '/guide/cli' },
            { text: 'Output Structure', link: '/guide/output-structure' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Built-in Plugins',
          items: [
            { text: 'Overview', link: '/plugins/built-in/' },
            { text: 'typescript-types', link: '/plugins/built-in/typescript-types' },
            { text: 'typescript-enums', link: '/plugins/built-in/typescript-enums' },
            { text: 'constants', link: '/plugins/built-in/constants' },
            { text: 'request-paths', link: '/plugins/built-in/request-paths' },
          ],
        },
        {
          text: 'Official Plugins',
          items: [
            { text: 'Overview', link: '/plugins/official/' },
            { text: 'React Query v5', link: '/plugins/official/react-query-v5' },
            { text: 'Vue Query v4', link: '/plugins/official/vue-query-v4' },
          ],
        },
        {
          text: 'Plugin Development',
          items: [
            { text: 'Creating Plugins', link: '/plugins/creating-plugins' },
            { text: 'Lifecycle Phases', link: '/plugins/lifecycle' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: '@schema-gen/core', link: '/api/core' },
            { text: '@schema-gen/plugin-sdk', link: '/api/plugin-sdk' },
            { text: 'AST Types', link: '/api/types' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/gkweb/schema-gen' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/gkweb/schema-gen/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2024-present gkweb',
    },
  },
});
