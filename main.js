const CryptoJS = require("crypto-js");
const pino = require("pino");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);
const { io: Socket } = require("socket.io-client");
let socket = Socket();
let { toBuffer } = require("qrcode");
const {
  default: makeWASocket,
  useSingleFileAuthState,
  Browsers,
  delay,
} = require("@adiwajshing/baileys");
const render = require("./render");
const { fstat, fsync, writeFileSync } = require("fs");

let PORT = process.env.PORT || 3030;
let c;
app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/qr.html");
});
app.get("/qr", async (req, res) => {
  let randid = makeid()
  const authfile = `./tmp/${randid}.json`;
  const { state } = useSingleFileAuthState(authfile, pino({ level: "silent" }));
  function Xasena() {
    try {
      let session = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        downloadHistory: false,
        syncFullHistory: false,
      });

      session.ev.on("connection.update", async (s) => {
        if (s.qr) {
          res.end(await toBuffer(s.qr));
        }
        const { connection, lastDisconnect } = s;
        if (connection == "open") {
          await delay(500 * 10);
          let code = btoa(randid);
          var words = code.split("");
          var ress = words[Math.floor(words.length / 2)];
          c = code.split(ress).join(ress + "_XASENA_");
          let str = render(c)
          writeFileSync('./session.html',str)
          const templateButtons = [
            {
              index: 1,
              urlButton: {
                displayText: "Copy Code",
                url: `https://www.whatsapp.com/otp/copy/${c}`,
              },
            },
            {
              index: 2,
              urlButton: {
                displayText: "Github",
                url: `github.com/Neeraj-x0/Millie-MD`,
              },
            },
          ];

          const templateMessage = {
            text: `\nᴅᴇᴀʀ ᴜsᴇʀ ᴛʜɪs ɪs ʏᴏᴜʀ sᴇssɪᴏɴ ɪᴅ
          
◕ ⚠️ *ᴘʟᴇᴀsᴇ ᴅᴏ ɴᴏᴛ sʜᴀʀᴇ ᴛʜɪs ᴄᴏᴅᴇ ᴡɪᴛʜ ᴀɴʏᴏɴᴇ ᴀs ɪᴛ ᴄᴏɴᴛᴀɪɴs ʀᴇǫᴜɪʀᴇᴅ ᴅᴀᴛᴀ ᴛᴏ ɢᴇᴛ ʏᴏᴜʀ ᴄᴏɴᴛᴀᴄᴛ ᴅᴇᴛᴀɪʟs ᴀɴᴅ ᴀᴄᴄᴇss ʏᴏᴜʀ ᴡʜᴀᴛsᴀᴘᴘ*`,
            footer: "sᴇssɪᴏɴ",
            templateButtons: templateButtons,
          };

          await session.sendMessage(session.user.id, templateMessage);
          await session.sendMessage(session.user.id, {
            document: { url: authfile },
            fileName: "session.json",
            mimetype: "application/json",
          });
          
          io.emit("message", c);
        }
        if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode != 401
        ) {
          Xasena();
        }
      });
    } catch (err) {
      console.log(
        err + "Unknown Error Occured Please report to Owner and Stay tuned"
      );
    }
  }

  Xasena();
});
app.get("/session", async (req, res) => {
  res.sendFile(__dirname+'/session.html');
});
server.listen(PORT, () => console.log("App listened on port", PORT));

socket.on("reset", () => {
  process.send("reset");
});

const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, (passphrase = "123")).toString();
};

const decrypt = (text) => {
  return CryptoJS.AES.decrypt(text, passphrase).toString();
};

function makeid(num = 9) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var characters9 = characters.length;
  for (var i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters9));
  }
  return result;
}

let encode = (f) => {
  return f.replace("=", "");
};
process.on("uncaughtException", (c) => {
  console.log(c);
});
