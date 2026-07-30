/* =============================================================================
 * config.js —— 静态配置 / 内容数据
 * 说明：AI 工具列表集中在此，方便「每月更新一次」时直接增删改，无需改动逻辑代码。
 *      名言 / 冷笑话 / 推荐影视读物也在此维护。
 * =========================================================================== */
const CONFIG = {

  systemName: '日富一日·钱途光明',

  /* 单数日展示：英文名言 / 鸡汤（短句为主） */
  enQuotes: [
    "Keep going.",
    "Start today.",
    "Small steps, big changes.",
    "You got this.",
    "Dream big, start small.",
    "Stay close to sunlight people.",
    "Make today your masterpiece.",
    "Fall seven times, stand up eight.",
    "Happiness is a choice.",
    "The best time is now.",
    "Hard work beats talent.",
    "Progress, not perfection.",
    "Be your own reason to smile.",
    "One day at a time."
  ],

  /* 双数日展示：中文冷笑话（短句） */
  cnJokes: [
    "企鹅为什么只有肚子是白的？手太短，搓不到背。",
    "小土豆想不当土豆了，变成薯条——结果更短了。",
    "风扇转圈圈不晕吗？它说：晕着晕着就习惯了。",
    "面条和包子打架，结果变成了馄饨。",
    "电脑为什么笨？只会算，不会想请客。",
    "闹钟和我互相尊重——它叫我起，我把它关掉。",
    "鱼为什么不说话？一开口就吐泡泡。",
    "香蕉去健身房，教练说：你先弯一下。它本来就是弯的。",
    "程序员分不清万圣节和圣诞节？因为 Oct 31 == Dec 25。",
    "蜗牛进酒吧点了一杯酒，拖了三年才喝完。",
    "西瓜被切成两半，一半说分了，另一半说拌了。",
    "作业本相亲被嫌太薄，它说我内涵丰富啊！",
    "猫的佛系人生：晒晒太阳，顺便活着。",
    "雨伞和雨鞋吵架：没我你早湿了 / 没我你早漂走了。",
    "考试写略，老师批阅，我们彼此心照不宣。"
  ],

  /* 灵感随记 - 每日推荐内容池（含副标题） */
  movies: [
    {n:'《星际穿越》',s:'爱是唯一可以超越时间与空间的事物'},
    {n:'《千与千寻》',s:'曾经发生的事不可能忘记，只是想不起来而已'},
    {n:'《肖申克的救赎》',s:'希望是美好的，也许是人间至善'},
    {n:'《疯狂动物城》',s:'尝试让世界变得更美好，就从你开始'},
    {n:'《海上钢琴师》',s:'陆地对我来说是一艘太大的船'},
    {n:'《寻梦环游记》',s:'死亡不是终点，遗忘才是'},
    {n:'《楚门的世界》',s:'如果再也不能见到你，祝你早安午晚安安'},
    {n:'《忠犬八公》',s:'永远不要忘记你所爱的人'},
    {n:'《怦然心动》',s:'有些人浅显，有些人金玉其外败絮其中'},
    {n:'《当幸福来敲门》',s:'别让人家告诉你，你成不了大器'},
    {n:'《寄生虫》',s:'有钱所以善良，没钱所以刻薄'},
    {n:'《摔跤吧！爸爸》',s:'面对恐惧是唯一的出路'},
    {n:'《绿皮书》',s:'世界上有太多孤独的人害怕先迈出第一步'},
    {n:'《小森林》',s:'认真对待每一餐，就是认真生活'},
    {n:'《阿甘正传》',s:'生活就像一盒巧克力'}
  ],
  tvs: [
    {n:'《繁花》',s:'不响最大声'},
    {n:'《庆余年》',s:'余温未了，庆历之年'},
    {n:'《漫长的季节》',s:'往前看，别回头'},
    {n:'《风骚律师》',s:'从好人到坏人只需要一个决定'},
    {n:'《请回答1988》',s:'青春之所以珍贵，是因为回不去'},
    {n:'《我的天才女友》',s:'女性的友谊比爱情更持久'},
    {n:'《三体》',s:'不要回答！不要回答！'},
    {n:'《大江大河》',s:'时代洪流中，每个人都在努力活'},
    {n:'《西部世界》',s:'如果你找不到路，就自己造一条'},
    {n:'《黑镜》',s:'科技越发达，人性越赤裸'},
    {n:'《生活大爆炸》',s:'聪明人的世界也可以很温暖'},
    {n:'《甄嬛传》',s:'臣妾做不到啊'},
    {n:'《功勋》',s:'默默无闻的人撑起了国家的脊梁'},
    {n:'《沉默的真相》',s:'真相也许会迟到，但绝不会缺席'},
    {n:'《隐秘的角落》',s:'蓝蓝的天空上飘着白云'}
  ],
  books: [
    {n:'《被讨厌的勇气》',s:'一切烦恼皆源于人际关系'},
    {n:'《活着》',s:'人是为了活着本身而活着'},
    {n:'《人类简史》',s:'我们以为的历史，可能只是故事'},
    {n:'《小王子》',s:'真正重要的东西用眼睛看不见'},
    {n:'《穷查理宝典》',s:'反过来想，总是反过来想'},
    {n:'《蛤蟆先生去看心理医生》',s:'没有人能让你不快乐，除了你自己'},
    {n:'《纳瓦尔宝典》',s:'财富和幸福都可以通过学习获得'},
    {n:'《思考，快与慢》',s:'你的大脑在欺骗你'},
    {n:'《明朝那些事儿》',s:'历史可以很好看'},
    {n:'《置身事内》',s:'读懂中国经济运行的底层逻辑'},
    {n:'《心流》',s:'最优体验心理学'},
    {n:'《你当像鸟飞往你的山》',s:'教育意味着获得不同的视角'},
    {n:'《认知觉醒》',s:'开启自我改变的原动力'},
    {n:'《非暴力沟通》',s:'让爱与理解自然流露'},
    {n:'《故事》',s:'材质、结构、风格和银幕剧作的原理'}
  ],

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

    /* —— 国内 · 做图 —— */
    { name:'通义万相',    url:'https://tongyi.aliyun.com/wanxiang',     cat:'做图', region:'cn' },
    { name:'文心一格',    url:'https://yige.baidu.com',                 cat:'做图', region:'cn' },
    { name:'堆友',        url:'https://d.design',                       cat:'做图', region:'cn' },
    { name:'秒画',        url:'https://miaohua.art',                    cat:'做图', region:'cn' },
    { name:'稿定AI',      url:'https://www.gaoding.com/ai',             cat:'做图', region:'cn' },
    { name:'美图AI',      url:'https://www.x-design.com',               cat:'做图', region:'cn' },
    { name:'Vega AI',     url:'https://vegaai.net',                     cat:'做图', region:'cn' },

    /* —— 国内 · 视频 —— */
    { name:'即梦AI',      url:'https://jimeng.jianying.com',            cat:'视频', region:'cn' },
    { name:'可灵',        url:'https://kling.kuaishou.com',             cat:'视频', region:'cn' },
    { name:'智谱清影',    url:'https://chatglm.cn/videos',              cat:'视频', region:'cn' },
    { name:'生数科技',    url:'https://vidu.studio',                    cat:'视频', region:'cn' },

    /* —— 国内 · 音乐 —— */
    { name:'天工音乐',    url:'https://music.tiangong.cn',              cat:'音乐', region:'cn' },
    { name:'海绵音乐',    url:'https://haimian.music',                  cat:'音乐', region:'cn' },

    /* —— 国内 · 写作/日常 —— */
    { name:'秘塔写作猫',  url:'https://xiezuocat.com',                  cat:'写作', region:'cn' },
    { name:'火山写作',    url:'https://www.volcengine.com/writing',     cat:'写作', region:'cn' },
    { name:'通义听悟',    url:'https://tingwu.aliyun.com',              cat:'日常', region:'cn' },
    { name:'通义效率',    url:'https://tongyi.aliyun.com/efficiency',    cat:'日常', region:'cn' },

    /* —— 国内 · 编程 —— */
    { name:'通义灵码',    url:'https://tongyi.aliyun.com/lingma',       cat:'编程', region:'cn' },
    { name:'CodeGeeX',    url:'https://codegeex.cn',                    cat:'编程', region:'cn' },
    { name:'Fitten Code',url:'https://code.fittentech.com',            cat:'编程', region:'cn' },

    /* —— 国外 · 对话 —— */
    { name:'ChatGPT',     url:'https://chat.openai.com',                cat:'对话', region:'foreign' },
    { name:'Claude',      url:'https://claude.ai',                      cat:'对话', region:'foreign' },
    { name:'Gemini',      url:'https://gemini.google.com',              cat:'对话', region:'foreign' },
    { name:'Copilot',     url:'https://copilot.microsoft.com',          cat:'对话', region:'foreign' },
    { name:'Perplexity',  url:'https://www.perplexity.ai',              cat:'对话', region:'foreign' },
    { name:'Pi',          url:'https://pi.ai',                          cat:'对话', region:'foreign' },
    { name:'Mistral',     url:'https://chat.mistral.ai',                cat:'对话', region:'foreign' },
    { name:'Groq',        url:'https://groq.com',                       cat:'对话', region:'foreign' },

    /* —— 国外 · 做图 —— */
    { name:'Midjourney',  url:'https://www.midjourney.com',             cat:'做图', region:'foreign' },
    { name:'DALL·E',      url:'https://openai.com/dall-e-3',            cat:'做图', region:'foreign' },
    { name:'Stable Diffusion', url:'https://stability.ai',              cat:'做图', region:'foreign' },
    { name:'Leonardo',    url:'https://leonardo.ai',                    cat:'做图', region:'foreign' },
    { name:'Ideogram',    url:'https://ideogram.ai',                    cat:'做图', region:'foreign' },
    { name:'Flux',        url:'https://flux1.ai',                       cat:'做图', region:'foreign' },
    { name:'Playground',  url:'https://playground.com',                 cat:'做图', region:'foreign' },
    { name:'Ideogram2',   url:'https://ideogram.ai/free',               cat:'做图', region:'foreign' },

    /* —— 国外 · 视频 —— */
    { name:'Runway',      url:'https://runwayml.com',                   cat:'视频', region:'foreign' },
    { name:'Pika',        url:'https://pika.art',                       cat:'视频', region:'foreign' },
    { name:'Kling(海外)', url:'https://klingai.com',                    cat:'视频', region:'foreign' },
    { name:'Luma Dream Machine',url:'https://lumalabs.ai/dream-machine',cat:'视频', region:'foreign' },
    { name:'Sora',        url:'https://sora.com',                       cat:'视频', region:'foreign' },
    { name:'Haiper',      url:'https://haiper.ai',                     cat:'视频', region:'foreign' },

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

    /* —— 国外 · 日常 —— */
    { name:'ChatGPT Search', url:'https://chatgpt.com/search',          cat:'日常', region:'foreign' },
    { name:'Otter.ai',    url:'https://otter.ai',                       cat:'日常', region:'foreign' },
    { name:'Gamma',       url:'https://gamma.app',                      cat:'日常', region:'foreign' },
    { name:'Canva AI',    url:'https://canva.com',                      cat:'日常', region:'foreign' }
  ],
  // 数据更新时间标注（每月更新时修改此值）
  lastUpdated: '2026-07'
};
