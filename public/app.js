const app = SeaSideJS.default.createApp(
    {
        data() {
            return {
                count: 1,
                time: new Date().toLocaleString(),
                show: true,
                lang: "en",
                language: {
                    en: {
                        desc: "A simple and convenient responsive framework designed to provide Reactive interaction functionality for regular web pages.",
                        version: "The site is using Version",
                        count: "Count",
                        time: "Time",
                        btn: {
                            show: "Show",
                            hide: "Hide",
                            increment: "Count++"
                        },
                    },
                    zh: {
                        desc: "一个简单方便的响应式框架，旨在为普通网页提供响应式交互功能。",
                        version: "这种站点正在使用",
                        count: "计数",
                        time: "时间",
                        btn: {
                            show: "显示",
                            hide: "隐藏",
                            increment: "计数++"
                        },
                    }
                }
            };
        },
        methods: {
            increment() {
                this.count++;
            },
        },
        template: SeaSideJS.getTemplate("#template"),
        mounted() {
            setInterval(() => {
                this.time = new Date().toLocaleString()
            }, 1000);
        }
    }
).mount("#app")