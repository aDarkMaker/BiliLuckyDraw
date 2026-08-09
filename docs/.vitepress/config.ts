import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

const repo = 'https://github.com/aDarkMaker/BiliLuckyDraw';
const releases = `${repo}/releases`;
const base = '/BiliLuckyDraw/';

export default withMermaid(
	defineConfig({
		title: 'BiliLuckyDraw',
		description: '基于 Wails v3 + Go + React + TypeScript 的 B 站直播间弹幕抽奖桌面应用',
		base,
		cleanUrls: true,
		lastUpdated: true,
		mermaid: { flowchart: { htmlLabels: false } },
		head: [['link', { rel: 'icon', href: `${base}img/logo.png` }]],
		themeConfig: {
			logo: '/img/logo.png',
		socialLinks: [{ icon: 'github', link: repo }],
		search: { provider: 'local' },
		footer: {
			message: 'Released under the MIT License.',
			copyright: 'Copyright © 2025 aDarkMaker',
		},
	},
	locales: {
		root: {
			label: '简体中文',
			lang: 'zh-CN',
			themeConfig: {
				nav: [
					{ text: '产品介绍', link: '/intro/product' },
					{ text: '架构', link: '/architecture/overview' },
					{ text: '开发', link: '/development/setup' },
					{ text: '应用场景', link: '/use-cases/scenarios' },
				],
				sidebar: [
					{
						text: '产品介绍',
						collapsed: false,
						items: [
							{ text: '产品介绍', link: '/intro/product' },
							{ text: '功能特性', link: '/intro/features' },
							{ text: '快速开始', link: '/intro/quickstart' },
						],
					},
					{
						text: '架构逻辑',
						collapsed: false,
						items: [
							{ text: '架构总览', link: '/architecture/overview' },
							{ text: '后端架构', link: '/architecture/backend' },
							{ text: '前端架构', link: '/architecture/frontend' },
							{ text: '数据流与事件', link: '/architecture/data-flow' },
						],
					},
					{
						text: '开发方式',
						collapsed: false,
						items: [
							{ text: '环境准备', link: '/development/setup' },
							{ text: '构建与打包', link: '/development/build' },
							{ text: '前端绑定', link: '/development/bindings' },
						],
					},
					{
						text: '应用场景',
						collapsed: false,
						items: [{ text: '应用场景介绍', link: '/use-cases/scenarios' }],
					},
				],
			},
		},
		en: {
			label: 'English',
			lang: 'en-US',
			themeConfig: {
				nav: [
					{ text: 'Product', link: '/en/intro/product' },
					{ text: 'Architecture', link: '/en/architecture/overview' },
					{ text: 'Development', link: '/en/development/setup' },
					{ text: 'Use Cases', link: '/en/use-cases/scenarios' },
				],
				sidebar: [
					{
						text: 'Product',
						collapsed: false,
						items: [
							{ text: 'Product', link: '/en/intro/product' },
							{ text: 'Features', link: '/en/intro/features' },
							{ text: 'Quick Start', link: '/en/intro/quickstart' },
						],
					},
					{
						text: 'Architecture',
						collapsed: false,
						items: [
							{ text: 'Overview', link: '/en/architecture/overview' },
							{ text: 'Backend', link: '/en/architecture/backend' },
							{ text: 'Frontend', link: '/en/architecture/frontend' },
							{ text: 'Data Flow & Events', link: '/en/architecture/data-flow' },
						],
					},
					{
						text: 'Development',
						collapsed: false,
						items: [
							{ text: 'Setup', link: '/en/development/setup' },
							{ text: 'Build & Package', link: '/en/development/build' },
							{ text: 'Frontend Bindings', link: '/en/development/bindings' },
						],
					},
					{
						text: 'Use Cases',
						collapsed: false,
						items: [{ text: 'Scenarios', link: '/en/use-cases/scenarios' }],
					},
				],
			},
		},
	},
}),
);
