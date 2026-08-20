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
  lastUpdated: '2026-08'
};
