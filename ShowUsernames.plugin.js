/**
 * * @name ShowUsernames
 * @version 1.0.0
 * @description Replace "Unknown User" with the real username (or nickname) when available, even if they’ve left the server.
 * @author SAMURAI
 * @source https://github.com/Lubu5449/ValidUser
 */

module.exports = (() => {
    const config = {
      info: {
        name: "ShowUsernames",
        version: "1.1.0",
        description: "Replace 'Unknown User' with the real username (or nickname), even if they’ve left the server.",
        authors: [{ name: "YourName", discord_id: "YourDiscordID" }],
      }
    };
  
    return !global.ZeresPluginLibrary ? class {
      constructor() { this._config = config; }
      getName() { return config.info.name; }
      getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
      getVersion() { return config.info.version; }
      load() {
        BdApi.showConfirmationModal(
          "Library Missing",
          `The library plugin needed for ${config.info.name} is missing. Please install ZeresPluginLibrary.`,
          {
            confirmText: "Download Library",
            cancelText: "Cancel",
            onConfirm: () => {
              require('request')("https://rauenzi.github.io/BDPluginLibrary/release/ZeresPluginLibrary.plugin.js",
                (err, _, body) => {
                  if (err) return BdApi.alert("Error", "Could not download library.");
                  require('fs').writeFileSync(
                    require('path').join(BdApi.Plugins.folder, "ZeresPluginLibrary.plugin.js"),
                    body
                  );
                });
            }
          }
        );
      }
      start() {}
      stop() {}
    } : (([Plugin, Library]) => {
      const { Patcher, DiscordModules, WebpackModules } = Library;
      const MessageUsername = WebpackModules.findByDisplayName("MessageUsername");
      const MemberStore = DiscordModules.GuildMemberStore;
  
      return class ShowUsernames extends Plugin {
        onStart() {
          Patcher.after(MessageUsername.prototype, "render", (_this, args, returnValue) => {
            try {
              const props = returnValue.props.children.props;
              if (props.text === "Unknown User") {
                const msg = args[0].message;
                // 1) Try server nickname if still in guild
                const member = MemberStore.getMember(msg.guild_id, msg.author.id);
                if (member && member.nick) {
                  props.text = member.nick;
                }
                // 2) Else fall back to raw author username
                else if (msg.author && msg.author.username) {
                  props.text = msg.author.username;
                }
              }
            } catch (err) {
              console.error(this.getName(), "patch error:", err);
            }
          });
        }
  
        onStop() {
          Patcher.unpatchAll();
        }
      };
    })(global.ZeresPluginLibrary.buildPlugin(config));
  })();
  