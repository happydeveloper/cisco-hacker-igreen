require("dotenv").config();
var framework = require("webex-node-bot-framework");
var webhook = require("webex-node-bot-framework/webhook");
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());
app.use(express.static("images"));
const config = {
  webhookUrl: process.env.WEBHOOKURL,
  token: process.env.BOTTOKEN,
  port: process.env.PORT,
};

// 프레임워크 초기화
var framework = new framework(config);
framework.start();
console.log("프레임워크 시작 중, 잠시만 기다려주세요...");

framework.on("initialized", () => {
  console.log("프레임워크 준비 완료! [종료하려면 CTRL-C를 누르세요]");
});

framework.on("spawn", (bot, id, actorId) => {
  if (!actorId) {
    console.log(`서버 재시작시 발견된 공간: ${bot.room.title}`);
  } else {
    var msg = "도움말을 보려면 'help'라고 말해주세요.";
    bot.webex.people
      .get(actorId)
      .then((user) => {
        msg = `안녕하세요 ${user.displayName}. ${msg}`;
      })
      .catch((e) => {
        console.error(`사용자 정보 조회 실패: ${e.message}`);
        msg = `안녕하세요. ${msg}`;
      })
      .finally(() => {
        if (bot.isDirect) {
          bot.say("markdown", msg);
        } else {
          let botName = bot.person.displayName;
          msg += `\n\n이 그룹 공간에서 메시지를 보려면 *@${botName}*을 언급해주세요.`;
          bot.say("markdown", msg);
        }
      });
  }
});

framework.on("log", (msg) => {
  console.log(msg);
});

framework.hears(
  "framework",
  (bot) => {
    console.log("framework 명령어 받음");
    bot.say(
      "markdown",
      "이 프레임워크의 주요 목적은 계속해서 새로운 기능이 추가되는 Webex에 대응하여 [webex-js-sdk](https://webex.github.io/webex-js-sdk) 기반의 프레임워크를 만드는 것입니다. 불필요한 Webex API 호출을 최소화하고, Webex 데이터 유형을 활용하여 효율성을 높이고 미래 기능 확장을 용이하게 하는 두 가지 테마를 중심으로 설계되었습니다."
    );
  },
  "**framework**: (Webex Bot Framework에 대해 알아보기)",
  0
);

framework.hears(
  "info",
  (bot, trigger) => {
    console.log("info 명령어 받음");
    let personAvatar = trigger.person.avatar;
    let personEmail = trigger.person.emails[0];
    let personDisplayName = trigger.person.displayName;
    let outputString = `여기에 당신의 개인 정보가 있습니다: \n\n\n **이름:** ${personDisplayName}  \n\n\n **이메일:** ${personEmail} \n\n\n **아바타 URL:** ${personAvatar}`;
    bot.say("markdown", outputString);
  },
  "**info**: (개인 정보 확인)",
  0
);

framework.hears(
  "space",
  (bot) => {
    console.log("space, 끝없는 공간");
    let roomTitle = bot.room.title;
    let spaceID = bot.room.id;
    let roomType = bot.room.type;

    let outputString = `이 공간의 제목: ${roomTitle} \n\n 공간 ID: ${spaceID} \n\n 공간 유형: ${roomType}`;

    console.log(outputString);
    bot
      .say("markdown", outputString)
      .catch((e) => console.error(`bot.say 실패: ${e.message}`));
  },
  "**space**: (이 공간에 대한 정보 얻기)",
  0
);

framework.hears(
  "say hi to everyone",
  (bot) => {
    console.log("모두에게 인사하기. 파티 시작!");
    bot.webex.memberships
      .list({ roomId: bot.room.id })
      .then((memberships) => {
        for (const member of memberships.items) {
          if (member.personId === bot.person.id) {
            continue;
          }
          let displayName = member.personDisplayName ? member.personDisplayName : member.personEmail;
          bot.say(`안녕 ${displayName}`);
        }
      })
      .catch((e) => {
        console.error(`sdk.memberships.list() 호출 실패: ${e.message}`);
        bot.say("여러분 안녕하세요!");
      });
  },
  "**say hi to everyone**: (Webex SDK를 사용해 모두에게 인사하기)",
  0
);

// 버튼 및 카드 데이터
let cardJSON = {
  $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  type: "AdaptiveCard",
  version: "1.0",
  body: [
    {
      type: "ColumnSet",
      columns: [
        {
          type: "Column",
          width: "5",
          items: [
            {
              type: "Image",
              url: "Your avatar appears here!",
              size: "large",
              horizontalAlignment: "Center",
              style: "person",
            },
            {
              type: "TextBlock",
              text: "Your name will be here!",
              size: "medium",
              horizontalAlignment: "Center",
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: "And your email goes here!",
              size: "small",
              horizontalAlignment: "Center",
              isSubtle: true,
              wrap: false,
            },
          ],
        },
      ],
    },
  ],
};

framework.hears(
  "card me",
  (bot, trigger) => {
    console.log("누군가 카드를 요청했습니다");
    let avatar = trigger.person.avatar;

    cardJSON.body[0].columns[0].items[0].url = avatar
      ? avatar
      : `${config.webhookUrl}/missing-avatar.jpg`;
    cardJSON.body[0].columns[0].items[1].text = trigger.person.displayName;
    cardJSON.body[0].columns[0].items[2].text = trigger.person.emails[0];
    bot.sendCard(
      cardJSON,
      "이 카드는 버튼과 카드를 지원하지 않는 클라이언트를 위한 맞춤형 대체 텍스트입니다"
    );
  },
  "**card me**: (개인화된 카드 제공)",
  0
);

framework.hears(
  "plant",
  (bot, trigger) => {
    console.log("노래 서버에서 제공");
    bot.reply(
      trigger.message,
      "식물의 소리를 들려줘",
      "markdown"
    );
    var msg_attach = {
      text: "식물에 음악을 들어보세요. https://www.youtube.com/watch?v=3EZqEvMoS3w",
      file: "https://media1.giphy.com/avatars/botanicabar_/pyUP8mU6fxg4.jpg",
    };
    bot.reply(trigger.message, msg_attach);
  },
  "**reply**: (메시지에 답장하기)",
  0
);
//Server config & housekeeping
// Health Check
app.get("/", (req, res) => {
  res.send(`I'm alive.`);
});

app.post("/", webhook(framework));

var server = app.listen(config.port, () => {
  framework.debug("framework listening on port %s", config.port);
});

// gracefully shutdown (ctrl-c)
process.on("SIGINT", () => {
  framework.debug("stopping...");
  server.close();
  framework.stop().then(() => {
    process.exit();
  });
});
