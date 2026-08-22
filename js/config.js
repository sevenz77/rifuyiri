/* =============================================================================
 * config.js —— 静态配置 / 内容数据
 * 说明：AI 工具列表集中在此，方便「每月更新一次」时直接增删改，无需改动逻辑代码。
 *      英文名言 / 中文心灵鸡汤 / 推荐影视读物也在此维护。
 * =========================================================================== */
const CONFIG = {

  systemName: '日富一日·钱途光明',

  /* =========================================================================
   * AI 工具网络（国内 / 国外）
   * 字段：name 名称, url 跳转地址, cat 分类, region 'cn'国内 | 'foreign'国外
   * 维护：每月更新只需在此增删条目即可，逻辑无需改动。
   * ======================================================================= */
  aiTools: [
    /* —— 国内 · 对话 —— */
    { name:'豆包',        url:'https://www.doubao.com',                 cat:'对话', region:'cn' },
    { name:'文心一言',    url:'https://yiyan.baidu.com',                cat:'对话', region:'cn' },
    { name:'通义千问',    url:'https://tongyi.aliyun.com',              cat:'对话', region:'cn' },
    { name:'Kimi',        url:'https://kimi.moonshot.cn',               cat:'对话', region:'cn' },
    { name:'智谱清言',    url:'https://chatglm.cn',                     cat:'对话', region:'cn' },
    { name:'讯飞星火',    url:'https://xinghuo.xfyun.cn',               cat:'对话', region:'cn' },
    { name:'腾讯混元',    url:'https://hunyuan.tencent.com',            cat:'对话', region:'cn' },
    { name:'DeepSeek',    url:'https://chat.deepseek.com',              cat:'对话', region:'cn' },
    { name:'月之暗面',    url:'https://platform.moonshot.cn',           cat:'对话', region:'cn' },
    { name:'零一万物',    url:'https://chat.lmstudio.cn',               cat:'对话', region:'cn' },
    { name:'百川智能',    url:'https://chat.baichuan-ai.com',           cat:'对话', region:'cn' },
    { name:'商汤商量',    url:'https://chat.sensetime.com',             cat:'对话', region:'cn' },
    { name:'360 智脑',    url:'https://ai.360.cn',                       cat:'对话', region:'cn' },
    { name:'阶跃星辰',    url:'https://www.stepfun.com',                 cat:'对话', region:'cn' },
    { name:'腾讯元宝',    url:'https://yuanbao.tencent.com',            cat:'对话', region:'cn' },
    { name:'海螺AI',      url:'https://www.minimax.chat',               cat:'对话', region:'cn' },
    { name:'天工AI',      url:'https://www.tiangong.cn',                cat:'对话', region:'cn' },
    { name:'华为盘古',    url:'https://pangu.huaweicloud.com',          cat:'对话', region:'cn' },
    { name:'小米MiMo',    url:'https://www.mi.com',                     cat:'对话', region:'cn' },
    { name:'美团LongCat', url:'https://www.meituan.com',                cat:'对话', region:'cn' },
    { name:'京东言犀',    url:'https://yanxi.jd.com',                   cat:'对话', region:'cn' },

    /* —— 国内 · 做图 —— */
    { name:'通义万相',    url:'https://tongyi.aliyun.com/wanxiang',     cat:'做图', region:'cn' },
    { name:'文心一格',    url:'https://yige.baidu.com',                 cat:'做图', region:'cn' },
    { name:'堆友',        url:'https://d.design',                       cat:'做图', region:'cn' },
    { name:'秒画',        url:'https://miaohua.art',                    cat:'做图', region:'cn' },
    { name:'稿定AI',      url:'https://www.gaoding.com/ai',             cat:'做图', region:'cn' },
    { name:'美图AI',      url:'https://www.x-design.com',               cat:'做图', region:'cn' },
    { name:'Vega AI',     url:'https://vegaai.net',                     cat:'做图', region:'cn' },
    { name:'即梦AI(做图)',url:'https://jimeng.jianying.com',            cat:'做图', region:'cn' },
    { name:'豆包绘画',    url:'https://www.doubao.com',                 cat:'做图', region:'cn' },
    { name:'海艺AI',      url:'https://hai.ai',                          cat:'做图', region:'cn' },
    { name:'混元生图',    url:'https://hunyuan.tencent.com',            cat:'做图', region:'cn' },
    { name:'星火绘世',    url:'https://xinghuo.xfyun.cn',               cat:'做图', region:'cn' },

    /* —— 国内 · 视频 —— */
    { name:'即梦AI',      url:'https://jimeng.jianying.com',            cat:'视频', region:'cn' },
    { name:'可灵',        url:'https://kling.kuaishou.com',             cat:'视频', region:'cn' },
    { name:'智谱清影',    url:'https://chatglm.cn/videos',              cat:'视频', region:'cn' },
    { name:'生数科技',    url:'https://vidu.studio',                    cat:'视频', region:'cn' },
    { name:'海螺视频',    url:'https://hailuoai.com',                   cat:'视频', region:'cn' },
    { name:'混元视频',    url:'https://hunyuan.tencent.com',            cat:'视频', region:'cn' },
    { name:'万相视频',    url:'https://tongyi.aliyun.com/wan',          cat:'视频', region:'cn' },
    { name:'PixVerse',    url:'https://pixverse.ai',                    cat:'视频', region:'cn' },
    { name:'智影',        url:'https://zenvideo.qq.com',                cat:'视频', region:'cn' },
    { name:'必剪Studio',  url:'https://member.bilibili.com',            cat:'视频', region:'cn' },
    { name:'快影',        url:'https://www.kuaishou.com',               cat:'视频', region:'cn' },
    { name:'开拍',        url:'https://www.kaijian.app',                cat:'视频', region:'cn' },
    { name:'天幕',        url:'https://www.wondershare.cn',             cat:'视频', region:'cn' },
    { name:'蒸汽机',      url:'https://wenxin.baidu.com',                cat:'视频', region:'cn' },

    /* —— 国内 · 音乐 —— */
    { name:'天工音乐',    url:'https://music.tiangong.cn',              cat:'音乐', region:'cn' },
    { name:'海绵音乐',    url:'https://haimian.music',                  cat:'音乐', region:'cn' },
    { name:'海螺音乐',    url:'https://www.minimax.chat',               cat:'音乐', region:'cn' },
    { name:'网易天音',    url:'https://tianyin.163.com',                cat:'音乐', region:'cn' },
    { name:'腾讯启明星',  url:'https://y.qq.com',                        cat:'音乐', region:'cn' },
    { name:'阶跃ACE-Step',url:'https://acestudio.ai',                   cat:'音乐', region:'cn' },
    { name:'MELO音乐',    url:'https://melo.ai',                         cat:'音乐', region:'cn' },

    /* —— 国内 · 写作/日常 —— */
    { name:'秘塔写作猫',  url:'https://xiezuocat.com',                  cat:'写作', region:'cn' },
    { name:'火山写作',    url:'https://www.volcengine.com/writing',     cat:'写作', region:'cn' },
    { name:'WPS AI',      url:'https://ai.wps.cn',                      cat:'写作', region:'cn' },
    { name:'笔灵AI',      url:'https://ibiling.cn',                     cat:'写作', region:'cn' },
    { name:'通义听悟',    url:'https://tingwu.aliyun.com',              cat:'日常', region:'cn' },
    { name:'通义效率',    url:'https://tongyi.aliyun.com/efficiency',    cat:'日常', region:'cn' },
    { name:'秘塔AI搜索',  url:'https://metaso.cn',                      cat:'日常', region:'cn' },
    { name:'扣子Coze',    url:'https://www.coze.cn',                    cat:'日常', region:'cn' },
    { name:'腾讯ima',     url:'https://ima.qq.com',                     cat:'日常', region:'cn' },
    { name:'飞书智能伙伴',url:'https://www.feishu.cn',                  cat:'日常', region:'cn' },
    { name:'钉钉AI助理',  url:'https://www.dingtalk.com',               cat:'日常', region:'cn' },
    { name:'腾讯会议AI',  url:'https://meeting.tencent.com',            cat:'日常', region:'cn' },
    { name:'讯飞听见',    url:'https://www.iflyrec.com',                cat:'日常', region:'cn' },
    { name:'夸克AI',      url:'https://www.quark.cn',                   cat:'日常', region:'cn' },
    { name:'纳米AI搜索',  url:'https://www.n.cn',                       cat:'日常', region:'cn' },

    /* —— 国内 · 编程 —— */
    { name:'通义灵码',    url:'https://tongyi.aliyun.com/lingma',       cat:'编程', region:'cn' },
    { name:'CodeGeeX',    url:'https://codegeex.cn',                    cat:'编程', region:'cn' },
    { name:'Fitten Code',url:'https://code.fittentech.com',            cat:'编程', region:'cn' },
    { name:'文心快码',    url:'https://baidu.com',                       cat:'编程', region:'cn' },
    { name:'Trae',        url:'https://www.trae.com.cn',                cat:'编程', region:'cn' },
    { name:'腾讯CodeBuddy',url:'https://www.codebuddy.ai',              cat:'编程', region:'cn' },
    { name:'华为CodeArts Snap',url:'https://www.huaweicloud.com',       cat:'编程', region:'cn' },
    { name:'Qoder',       url:'https://qoder.com',                      cat:'编程', region:'cn' },
    { name:'蚂蚁CodeFuse',url:'https://codefuse.ai',                    cat:'编程', region:'cn' },

    /* —— 国外 · 对话 —— */
    { name:'ChatGPT',     url:'https://chat.openai.com',                cat:'对话', region:'foreign' },
    { name:'Claude',      url:'https://claude.ai',                      cat:'对话', region:'foreign' },
    { name:'Gemini',      url:'https://gemini.google.com',              cat:'对话', region:'foreign' },
    { name:'Copilot',     url:'https://copilot.microsoft.com',          cat:'对话', region:'foreign' },
    { name:'Perplexity',  url:'https://www.perplexity.ai',              cat:'对话', region:'foreign' },
    { name:'Pi',          url:'https://pi.ai',                          cat:'对话', region:'foreign' },
    { name:'Mistral',     url:'https://chat.mistral.ai',                cat:'对话', region:'foreign' },
    { name:'Groq',        url:'https://groq.com',                       cat:'对话', region:'foreign' },
    { name:'Meta AI',     url:'https://www.meta.ai',                      cat:'对话', region:'foreign' },
    { name:'Le Chat',     url:'https://chat.mistral.ai/chat',             cat:'对话', region:'foreign' },

    /* —— 国外 · 做图 —— */
    { name:'Midjourney',  url:'https://www.midjourney.com',             cat:'做图', region:'foreign' },
    { name:'DALL·E',      url:'https://openai.com/dall-e-3',            cat:'做图', region:'foreign' },
    { name:'Stable Diffusion', url:'https://stability.ai',              cat:'做图', region:'foreign' },
    { name:'Leonardo',    url:'https://leonardo.ai',                    cat:'做图', region:'foreign' },
    { name:'Ideogram',    url:'https://ideogram.ai',                    cat:'做图', region:'foreign' },
    { name:'Flux',        url:'https://flux1.ai',                       cat:'做图', region:'foreign' },
    { name:'Playground',  url:'https://playground.com',                 cat:'做图', region:'foreign' },
    { name:'Ideogram2',   url:'https://ideogram.ai/free',               cat:'做图', region:'foreign' },
    { name:'Recraft',     url:'https://www.recraft.ai',                   cat:'做图', region:'foreign' },

    /* —— 国外 · 视频 —— */
    { name:'Runway',      url:'https://runwayml.com',                   cat:'视频', region:'foreign' },
    { name:'Pika',        url:'https://pika.art',                       cat:'视频', region:'foreign' },
    { name:'Kling(海外)', url:'https://klingai.com',                    cat:'视频', region:'foreign' },
    { name:'Luma Dream Machine',url:'https://lumalabs.ai/dream-machine',cat:'视频', region:'foreign' },
    { name:'Sora',        url:'https://sora.com',                       cat:'视频', region:'foreign' },
    { name:'Haiper',      url:'https://haiper.ai',                     cat:'视频', region:'foreign' },
    { name:'Veo',         url:'https://deepmind.google/technologies/veo', cat:'视频', region:'foreign' },

    /* —— 国外 · 音乐 —— */
    { name:'Suno',        url:'https://suno.com',                       cat:'音乐', region:'foreign' },
    { name:'Udio',        url:'https://udio.com',                       cat:'音乐', region:'foreign' },
    { name:'Stability Audio',url:'https://stability.ai/stable-audio',  cat:'音乐', region:'foreign' },

    /* —— 国外 · 写作 —— */
    { name:'Grammarly',   url:'https://www.grammarly.com',              cat:'写作', region:'foreign' },
    { name:'Notion AI',   url:'https://www.notion.so/product/ai',       cat:'写作', region:'foreign' },
    { name:'Jasper',      url:'https://jasper.ai',                      cat:'写作', region:'foreign' },
    { name:'Copy.ai',     url:'https://copy.ai',                        cat:'写作', region:'foreign' },

    /* —— 国外 · 编程 —— */
    { name:'Cursor',      url:'https://cursor.com',                     cat:'编程', region:'foreign' },
    { name:'GitHub Copilot', url:'https://github.com/features/copilot', cat:'编程', region:'foreign' },
    { name:'Replit Agent',url:'https://replit.com/agent',               cat:'编程', region:'foreign' },
    { name:'v0.dev',      url:'https://v0.dev',                         cat:'编程', region:'foreign' },
    { name:'Bolt.new',    url:'https://bolt.new',                       cat:'编程', region:'foreign' },
    { name:'Windsurf',    url:'https://codeium.com/windsurf',             cat:'编程', region:'foreign' },
    { name:'Cody',        url:'https://sourcegraph.com/cody',             cat:'编程', region:'foreign' },

    /* —— 国外 · 日常 —— */
    { name:'ChatGPT Search', url:'https://chatgpt.com/search',          cat:'日常', region:'foreign' },
    { name:'Otter.ai',    url:'https://otter.ai',                       cat:'日常', region:'foreign' },
    { name:'Gamma',       url:'https://gamma.app',                      cat:'日常', region:'foreign' },
    { name:'Canva AI',    url:'https://canva.com',                      cat:'日常', region:'foreign' }
  ],
  // 数据更新时间标注（每月更新时修改此值）
  lastUpdated: '2026-08',

  /* =========================================================================
   * AI+ · API KEYS（国内原生官方平台 + 聚合/中转平台）
   * 字段：name 名称, openLabel 主入口标签, openUrl 主入口地址,
   *       siteUrl 官网地址(可选), base 接入 base_url, models/support 模型说明, note 备注
   * 维护：说「更新【AI+模块】」时，由 AI 读取 AI+模块专用/ 下对应 .md 重建本段，并改 apiUpdated。
   * ======================================================================= */
  apiUpdated: '2026-08-21 01:51',
  apiPlatforms: {
    official: [
      { name:'DeepSeek 深度求索', openLabel:'开放平台', openUrl:'https://platform.deepseek.com/', siteUrl:'https://www.deepseek.com', base:'https://api.deepseek.com/v1', models:'deepseek-v4-pro、deepseek-v4-flash', note:'1M 上下文；V4-Pro 2026-08-13 正式 GA；V3 系列别名 deepseek-chat / deepseek-reasoner 2026-07-24 停止维护，不建议新接入。' },
      { name:'Moonshot AI 月之暗面（Kimi API）', openLabel:'开放平台', openUrl:'https://platform.moonshot.cn/', siteUrl:'https://kimi.moonshot.cn', base:'https://api.moonshot.cn/v1', models:'kimi-k3、kimi-k3-swarm-max', note:'百万上下文、原生多模态；kimi-k3 2026-07-16 正式上线 API，2026-07-27 开源权重；旧 k2 系列逐步降级维护。' },
      { name:'智谱 AI GLM', openLabel:'开放平台', openUrl:'https://open.bigmodel.cn/', siteUrl:'https://www.bigmodel.cn', base:'https://open.bigmodel.cn/api/paas/v4', models:'GLM-5.2、GLM-5V-Turbo', note:'GLM-5.2 2026-06-17 上线开源 MIT 协议，百万无损长上下文；GLM-5.3 内测待发布，新接入优先 5.2；GLM-4 系列逐步下线。' },
      { name:'阿里云百炼（通义千问 Qwen）', openLabel:'开放平台', openUrl:'https://bailian.console.aliyun.com/', siteUrl:'https://www.aliyun.com/product/tongyi', base:'https://dashscope.aliyuncs.com/compatible-mode/v1', models:'Qwen3.5-Max、Qwen3.5-Plus、QwQ-32B', note:'Qwen3.5 为当前主力，Qwen3.8 灰度测试中；QwQ-32B 推理模型可用，原生 Function Calling；Qwen3 系列旧版本不再推荐新接入。' },
      { name:'零一万物 Yi 大模型', openLabel:'开放平台', openUrl:'https://platform.lingyiwanwu.com/', siteUrl:'https://www.lingyiwanwu.com', base:'https://api.lingyiwanwu.com/v1', models:'Yi-Lightning、Yi-Vision-v2', note:'Yi-Lightning 智能路由旗舰；Yi-Vision-v2 最新视觉版本；老 Yi-34B 已归档。' },
      { name:'百川智能', openLabel:'开放平台', openUrl:'https://platform.baichuan-ai.com/', siteUrl:'https://www.baichuan-ai.com', base:'https://api.baichuan-ai.com/v1', models:'Baichuan4-Turbo、Baichuan4-Air', note:'Baichuan4 系列为当前主力；Baichuan3-Turbo-128k 进入维护期；医疗专项 Baichuan-M4 / M3-Plus。' },
      { name:'阶跃星辰 StepFun', openLabel:'开放平台', openUrl:'https://platform.stepfun.com/', siteUrl:'https://www.stepfun.com', base:'https://api.stepfun.com/v1', models:'Step-3.7-Flash、Step-3.5-Flash', note:'Step-3.7-Flash 旗舰多模态，支持视频理解 + Agent 工具调用；Step-3.5-Flash 开源基座；老 Step-3 系列停止迭代。' },
      { name:'MiniMax ABAB', openLabel:'开放平台', openUrl:'https://platform.minimaxi.com/', siteUrl:'https://www.minimaxi.com', base:'https://api.minimaxi.chat/v1', models:'MiniMax-M2、MiniMax-M2.7', note:'M2.7 为最新迭代版本，面向 Agent / 代码；限时免费政策至 2026-11；ABAB-6.x 旧模型逐步下线。' },
      { name:'腾讯混元 TokenHub', openLabel:'控制台', openUrl:'https://console.cloud.tencent.com/tokenhub', siteUrl:'https://cloud.tencent.com/product/hunyuan', base:'https://api.hunyuan.cloud.tencent.com/v1', models:'hunyuan-hy3、Hy-MT2-30B-A3B', note:'Hy3 2026-07-06 GA，Apache 2.0 开源 MoE；Hy-MT2 多语种翻译；旧 hy2 系列归档。' },
      { name:'百度千帆 文心一言 ERNIE', openLabel:'开放平台', openUrl:'https://console.bce.baidu.com/qianfan', siteUrl:'https://ai.baidu.com/wenxin', base:'https://qianfan.baidubce.com/v2', models:'ERNIE-5.1、ERNIE-5.0', note:'ERNIE-5.1 最新迭代，强化 Agent 深度搜索；4.x 系列逐步缩减配额。' },
      { name:'火山引擎方舟 豆包 Doubao', openLabel:'控制台', openUrl:'https://console.volcengine.com/ark', siteUrl:'https://www.volcengine.com/ark', base:'https://ark.cn-beijing.volces.com/api/v3', models:'Doubao-Seed-2.1-Pro、Doubao-Seed-2.1-Turbo', note:'调用必须填写对应 Endpoint 接入点。Seed-2.1 系列 2026-06-23 发布，Coding、VLM、Agent 能力增强；旧 Seed-1.x 不再推荐。' },
      { name:'科大讯飞星火', openLabel:'开放平台', openUrl:'https://xinghuo.xfyun.cn/openapi', siteUrl:'https://www.xfyun.cn', base:'https://maas-api.cn-huabei-1.xf-yun.com/v2', models:'星火 X2、星火 X2-Flash、星火 X2-VL', note:'X2 全系列当前主力；X1 系列进入维护模式。' }
    ],
    aggregate: [
      { name:'硅基流动 SiliconCloud', openLabel:'控制台', openUrl:'https://cloud.siliconflow.cn/', siteUrl:'https://siliconflow.cn', base:'https://api.siliconflow.cn/v1', support:'国内 + 国外（以开源模型为主）', note:'国内直连，大量国产开源模型；同时支持 Llama、Gemma 等海外开源；闭源 GPT / Claude 不提供；新用户实名赠送代金券。' },
      { name:'n1n.ai', openLabel:'官网', openUrl:'https://n1n.ai', siteUrl:'', base:'https://api.n1n.ai/v1', support:'国内 + 国外', note:'企业向聚合平台；国产全系列 + GPT / Claude / Gemini 海外闭源；支持支付宝、对公转账、增值税发票；亚洲专线优化海外模型访问。' },
      { name:'DMXAPI', openLabel:'官网', openUrl:'https://dmxapi.com', siteUrl:'', base:'https://dmxapi.com/v1', support:'国内 + 国外', note:'覆盖国产模型、OpenAI、Anthropic、Google 系列以及 Midjourney / Suno 多模态；晚高峰并发稳定性一般，适合非强实时场景。' },
      { name:'数眼智能 DataEyesAI', openLabel:'官网', openUrl:'https://shuyanai.com', siteUrl:'', base:'https://api.shuyanai.com/v1', support:'国内 + 国外', note:'多条线路可选；国产 + 海外闭源模型；支持对公开票，兼容 Cursor 等开发工具。' },
      { name:'白山智算', openLabel:'官网', openUrl:'https://ai.baishan.com', siteUrl:'', base:'https://api.edgefn.net/v1', support:'国内 + 国外', note:'聚合主流国产开源与海外主流模型；人民币按量计费。' },
      { name:'ModelScope 魔搭社区', openLabel:'控制台', openUrl:'https://modelscope.cn/', siteUrl:'', base:'https://modelscope.cn/api/v1', support:'国内为主，少量海外开源', note:'阿里达摩院开源社区；以 Qwen 系列国产开源权重为主；海外闭源模型不提供。' },
      { name:'云雾API CloudMist', openLabel:'官网', openUrl:'https://www.cloudmist.cloud', siteUrl:'', base:'https://api.cloudmist.cloud/v1', support:'国内 + 国外', note:'国内网络直连；国产 + 海外闭源模型；注册赠送小额测试额度。' },
      { name:'算桥API（算家云）', openLabel:'官网', openUrl:'https://suanjiayun.com', siteUrl:'', base:'https://api.suanjiayun.com/v1', support:'国内 + 国外', note:'自有 GPU 算力兜底；兼容 OpenAI 接口；同时支持国产以及 GPT-4o、Claude、Gemini 等海外旗舰模型，适合个人中小团队。' },
      { name:'OpenCode Go', openLabel:'官网', openUrl:'https://opencode.ai/go', siteUrl:'', base:'https://opencode.ai/zen/go/v1', support:'国外为主（侧重代码类开源模型）', note:'统一网关聚合海外第三方代码向模型；OpenAI 兼容接口；包月订阅为主（首月 5 美元，续购每月 10 美元）；支付宝人民币支付；API 接口大陆可直连；非国内合规平台，仅限个人测试。' },
      { name:'AI GO CODE（AIGoCode）', openLabel:'控制台', openUrl:'https://www.aigocode.com/dashboard/console', siteUrl:'https://aigocode.com', base:'https://aigocode.com/v1', support:'国外为主（Claude、Codex、Gemini 等，侧重代码/编程场景）', note:'一站式 AI 编程工作台；OpenAI / Anthropic / Google 兼容接口；计费采用「订阅额度 + 灵活额度」双轨：订阅套餐 4 周起（Standard ¥399/4周、Premium ¥899/4周、Professional ¥1799/4周），灵活额度 ¥50=$50 永久有效；支持微信 / 支付宝 / 信用卡人民币支付；国内网络直连；无免费注册额度；适合专业开发者与团队编程协作。' }
    ]
  },

  /* =========================================================================
   * AI+ · 第三方聊天客户端（按平台优先级四大分组）
   * 字段：name 名称, platform 平台, dl 下载链接(可空), fee 收费, note 备注
   * 维护：说「更新【AI+模块】」时，由 AI 读取 AI+模块专用/ 下对应 .md 重建本段，并改 clientsUpdated。
   * ======================================================================= */
  clientsUpdated: '2026-08-21 01:56',

  /* =========================================================================
   * AI+ · 提示词库
   * 字段：
   *   privatePrompts: [{ id, title, desc, tags:[], content }]
   *   externalPrompts: [{ name, intro, url, source:'site'|'github' }]
   * 维护：说「更新【AI+模块】」时，由 AI 读取 AI+模块专用/ 下对应 .md 重建本段，并改 promptsUpdated。
   *   私有指令的 tags 用于页内分类筛选（用户自设、可在新增/编辑时填入）。
   *   外部导航：source 标记区分「普通站点 site」与「GitHub 仓库 github」（卡片显示对应角标）。
   *   用户手动添加的链接存 localStorage（State.externalUser），不进 config。
   * ========================================================================= */
  promptsUpdated: '2026-08-22 17:18',
  privatePrompts: [
    { id:'prompt-1', title:'新媒体标题党生成器', desc:'输入主题，输出 5 个高点击率标题', tags:['通用对话模型','新媒体','标题党'], content:'你是一位资深新媒体编辑。请围绕用户给定的主题，输出 5 个不同风格的标题（悬念型、数字型、对比型、痛点型、共鸣型），并简要说明每个标题的吸睛点。主题：{{主题}}' },
    { id:'prompt-2', title:'小说场景扩写', desc:'把一句话梗概扩展成 300 字细腻场景', tags:['Claude','GPT-4','写作'], content:'你擅长细腻的场景描写。请将下面的一句话梗概扩写成一段约 300 字的场景描写，保留省略号与留白，避免 AI 味句式。梗概：{{梗概}}' },
    { id:'prompt-3', title:'Excel 数据清洗', desc:'把脏数据整理成结构化表格', tags:['通用对话模型','办公','表格'], content:'请将用户提供的原始文本数据清洗并整理成 Markdown 表格。要求：1) 统一日期格式为 YYYY-MM-DD；2) 金额统一保留两位小数；3) 去除空行与重复项；4) 在表格下方给出清洗说明。数据：{{数据}}' },
    { id:'prompt-4', title:'AI 工具选型对比', desc:'输入需求，给出三款工具横向对比', tags:['通用对话模型','决策','工具'], content:'用户有一个具体需求，请推荐 3 款最合适的工具/方案，用表格对比价格、优缺点、适用场景，并给出最终推荐。需求：{{需求}}' },
    { id:'prompt-5', title:'通用万能优化Prompt（LangGPT结构）', desc:'用 LangGPT 结构化框架优化你的简短指令，适配 GPT', tags:['通用对话模型','GPT','提示词优化','LangGPT'], content:'请使用LangGPT结构化框架优化下面这条提示词，补充角色、约束、工作流程、输出格式；不要编造额外需求，保留我的原始目标，输出一份可以直接粘贴进GPT使用的完整提示词：\n【粘贴你原始简短指令】' },
    { id:'prompt-6', title:'DS提示词生成专家', desc:'根据需求生成一份 Markdown 格式的智能助手提示词', tags:['通用对话模型','DeepSeek','提示词生成','GPT'], content:'你是一位大模型提示词生成专家，请根据用户的需求编写一个智能助手的提示词，来指导大模型进行内容生成，要求：\n1. 以 Markdown 格式输出\n2. 贴合用户需求，描述智能助手的定位、能力、知识储备\n3. 提示词应清晰、精确、易于理解，在保持质量的同时，尽可能简洁\n4. 只输出提示词，不要输出多余解释\n【粘贴你的助手要求】' }
  ],
  externalPrompts: [
    /* ===== 国内直连 · 中文优先（中文综合平台） ===== */
    { name:'AiShort', region:'cn', intro:'【免费·游客可浏览/搜索/复制，注册仅解锁收藏】中文 AI 快捷指令表，分类清晰、一键复制。纯模板库，不支持自动生成/优化。', url:'https://www.aishort.top/', source:'site' },
    { name:'驾驭AI', region:'cn', intro:'【基础免费；提示词库游客可浏览复制，AI提示词优化器需注册】一句话粗糙短句自动扩写成结构化专业 prompt（对标 LangGPT 思路），兼容 GPT/Claude/豆包/Kimi。', url:'https://www.jiayuai.net/', source:'site' },
    { name:'Prompt123', region:'cn', intro:'【全部免费·游客直接用无需注册】中文现成 prompt 库（GPT/Kimi/DeepSeek），覆盖文案/学术/短视频/编程；内置简易提示词生成工具。', url:'https://www.prompt123.cn/', source:'site' },
    { name:'PromptFlow', region:'cn', intro:'【免费开源·游客零注册】模板库 + 需求输入自动生成 prompt、反向提纯优化，结构化输出，贴近 LangGPT 模块化思想；浏览器本地运行。', url:'https://llyhy.github.io/promptflow/', source:'site' },
    { name:'WayToAGI 提示词库', region:'cn', intro:'【免费】中文精选 Prompt，覆盖文案、脚本、运营全场景。', url:'https://www.waytoagi.com/zh/prompts', source:'site' },
    { name:'PromptHub', region:'cn', intro:'【免费】中文 AI 提示词社区，5000+ 模板，浏览器插件可用。', url:'https://prompthub.xin/', source:'site' },
    { name:'PromptUp', region:'cn', intro:'【免费】提示词发现、存储与分享平台，多语言支持。', url:'https://promptup.net/', source:'site' },
    { name:'发现 AI 指令', region:'cn', intro:'【免费】高阶 AI 指令词合集，覆盖内容创作、电商、学术等。', url:'https://www.faxianai.com/prompt/deepseek', source:'site' },
    { name:'AI 指令合集', region:'cn', intro:'【免费】工具网站指令合集，覆盖写作、面试、程序开发等。', url:'https://www.luyinzhushou.com/aizhiling/', source:'site' },
    /* ===== 海外 · GPT 原生（ChatGPT/GPT4o 社区 & 专业优化工具） ===== */
    { name:'FlowGPT', region:'foreign', intro:'【基础免费（部分 GPTs/专属 prompt 付费）；游客可搜索/查看/复制，发布需注册】全球海量 GPT 实测提示词、完整系统角色 prompt，可找到大量结构化 LangGPT 风格模板。', url:'https://flowgpt.com', source:'site' },
    { name:'Promptsa', region:'foreign', intro:'【基础免费·有每日限额；游客免注册用全套生成/优化工具，原生中文】一句话需求自动生成适配 GPT/Claude 的专业 prompt，支持已有提示词优化。', url:'https://promptsa.com/zh-CN', source:'site' },
    { name:'Get Prompt', region:'foreign', intro:'【免费版每日限额；游客免注册全套生成/优化/质检工具】提示词生成、润色优化、质量打分，专门适配 GPT 系列模型。', url:'https://getprompt.cc', source:'site' },
    { name:'PromptTools.dev', region:'foreign', intro:'【基础免费·每日限额；游客免注册】Prompt 优化、质量评分、多模型对比测试，适合精细调试 GPT 提示词。', url:'https://prompttools.dev/', source:'site' },
    { name:'PromptHero', region:'foreign', intro:'【免费】全球最大提示词库之一，覆盖文生图、ChatGPT 等。', url:'https://prompthero.com', source:'site' },
    { name:'PromptBase', region:'foreign', intro:'【免费浏览】提示词交易市场，覆盖写作、图像、编程。', url:'https://promptbase.com', source:'site' },
    { name:'SnackPrompt', region:'foreign', intro:'【免费】团队协作型提示词库，可按角色/场景筛选。', url:'https://snackprompt.com', source:'site' },
    { name:'AIPRM', region:'foreign', intro:'【免费插件】浏览器插件，直接在 ChatGPT 页面调用数千 Prompt。', url:'https://www.aiprm.com', source:'site' },
    { name:'LangGPT', region:'foreign', intro:'【开源免费·非在线工具】结构化提示词框架（Role/Profile/Skills/Rules/Workflow），学会后可自己把简单需求搭成高质量结构化 prompt；很多平台优化逻辑源自它。', url:'https://github.com/EmbraceAGI/LangGPT', source:'github' },
    { name:'Awesome ChatGPT Prompts', region:'foreign', intro:'【开源免费】英文经典提示词仓库，持续更新。', url:'https://github.com/f/awesome-chatgpt-prompts', source:'github' }
  ],

  thirdPartyClients: {
    groups: [
      { title:'Windows + 原生安卓双端', items:[
        { name:'Kelivo', platform:'Windows/macOS/Linux + 原生 Android', dl:'https://github.com/Chevey339/kelivo', fee:'全部功能免费；仅自愿赞助，无功能锁定', note:'开源，支持 MCP、多模态、密钥本地加密，同时支持 iOS、鸿蒙安装包。' },
        { name:'Chatbox AI', platform:'Windows/macOS/Linux + 原生 Android', dl:'https://github.com/Bin-Huang/chatbox', fee:'核心功能永久免费；可选 Pro 云同步订阅（非必需）', note:'支持 WebDAV 会话同步。' },
        { name:'NextChat（打包客户端版）', platform:'Windows/macOS/Linux + 原生 Android', dl:'https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web', fee:'本地客户端免费开源；官方网页托管版付费', note:'轻量化，兼容 OpenAI 格式接口，支持语音对话、Prompt 模板。' },
        { name:'Operit AI', platform:'Windows + 原生 Android', dl:'https://github.com/AAswordman/Operit', fee:'基础功能免费；高级 Agent / 自动化功能付费解锁', note:'安卓悬浮窗、MCP、本地模型支持。' }
      ]},
      { title:'仅 PC 桌面端（Windows/macOS/Linux）', items:[
        { name:'Cherry Studio', platform:'Windows/macOS/Linux（仅 PC）', dl:'https://github.com/CherryHQ/cherry-studio', fee:'个人社区版永久免费；商业场景付费授权', note:'支持 MCP、文档解析、多模型对比。' },
        { name:'Jan', platform:'Windows/macOS/Linux（仅 PC）', dl:'https://github.com/janhq/jan', fee:'基础版免费；Pro 订阅付费', note:'本地 GGUF 模型 + OpenAI 标准 API 兼容。' },
        { name:'LM Studio', platform:'Windows/macOS/Linux（仅 PC）', dl:'https://lmstudio.ai', fee:'完全免费无内购', note:'主打本地大模型运行。' },
        { name:'AnythingLLM', platform:'Windows/macOS/Linux（仅 PC）', dl:'https://github.com/Mintplex-Labs/anything-llm', fee:'本地部署免费；官方云端托管订阅收费', note:'RAG 知识库，适合大批量文档问答。' }
      ]},
      { title:'WebUI 方案（PC 浏览器；安卓仅 PWA）', items:[
        { name:'LobeChat', platform:'PC 浏览器；安卓 PWA 适配', dl:'https://github.com/lobehub/lobe-chat', fee:'自部署开源免费；官方云托管订阅收费', note:'插件、Agent、MCP 生态完善。' },
        { name:'Open WebUI', platform:'PC 浏览器；安卓 PWA 适配', dl:'https://github.com/open-webui/open-webui', fee:'开源完全免费，无软件订阅', note:'原生适配 Ollama，兼容各类 API 服务商。' },
        { name:'LibreChat', platform:'PC 浏览器；安卓 PWA 适配', dl:'https://github.com/danny-avila/LibreChat', fee:'自部署免费开源；官方托管服务付费', note:'多用户管理，内置大量模型预设。' }
      ]},
      { title:'仅安卓原生客户端', items:[
        { name:'Maid', platform:'仅 Android', dl:'https://github.com/Mobile-Artificial-Intelligence/maid', fee:'基础开源免费；捐赠解锁额外功能', note:'轻量手机对话工具。' },
        { name:'LMSA', platform:'仅 Android', dl:'https://github.com/peterrhone/LMSA', fee:'免费版功能受限；Pro 一次性买断', note:'支持本地模型 + 远程 API。' },
        { name:'YourOwnAI', platform:'仅 Android', dl:'https://github.com/OlgaKalinina101/YourOwnAI', fee:'基础免费，高级功能订阅制', note:'移动端多模态对话。' },
        { name:'RikkaHub', platform:'仅 Android', dl:'https://github.com/rikkahub/rikkahub', fee:'开源免费，无付费锁定', note:'Material You 现代 UI，支持 MCP、工作区 Agent、多模态，支持自定义请求头。' }
      ]}
    ]
  }
};
