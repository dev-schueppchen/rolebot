/** @format */

import Discord from 'discord.js';
import Log4js from 'log4js';
import Secrets from '../config/secrets.json';
import Config from '../config/config.json';

const log = Log4js.getLogger('main');
const client = new Discord.Client();

log.level = 'info';

//////////////////////////////////////////////////////
/// INIT DISCORD HANDLERS

client.on('ready', () => {
  log.info(`Logged in as ${client.user?.tag}`);
  client.user?.setPresence({
    activity: {
      type: 'CUSTOM_STATUS',
      name: 'Mention me!',
    },
  });
});

client.on('message', async (msg) => {
  if (
    msg.author.id === client.user?.id ||
    msg.author.bot ||
    msg.channel.type !== 'text'
  )
    return;

  const match = new RegExp(`^<@!?${client.user?.id}>`).exec(msg.content);
  if (!match) return;

  msg.delete();

  const content = msg.content.slice(match[0].length).trim().toLowerCase();

  if (!content) {
    const roles = Config.roles
      .map((r) => `- **@${r.name}**: ${r.tags.join(', ')}`)
      .join('\n');

    msg.reply(
      'Hey! I can add and remove roles for you listed below!\n\n' +
        roles +
        '\n\nJust mention me with one of the tags listed above to add or remove a role.'
    );

    return;
  }

  const role = Config.roles.find(
    (r) => r.tags.includes(content) || r.name.toLowerCase() === content
  );

  if (!role) {
    (
      await msg.reply(
        `Sorry, but there is no role with the identifier '${content}'.`
      )
    ).delete({ timeout: 8000 });
    return;
  }

  const memberRole = msg.member?.roles.cache.find((r) => r.name === role.name);
  if (memberRole) {
    await msg.member?.roles.remove(memberRole);
    (await msg.reply(`Removed role ${role.name}.`)).delete({ timeout: 8000 });
    return;
  }

  let guildRole = msg.guild?.roles.cache.find((r) => r.name === role.name);
  if (!guildRole) {
    guildRole = await msg.guild?.roles.create({
      data: {
        color: role.color,
        hoist: role.hoisted,
        mentionable: role.mentionable,
        name: role.name,
      },
    });
  }

  await msg.member?.roles.add(guildRole!);
  (await msg.reply(`Added role ${role.name}.`)).delete({ timeout: 8000 });
});

//////////////////////////////////////////////////////
/// CHECK ROLE INTEGRITY

(() => {
  const aliases: string[] = [];
  const names: string[] = [];

  Config.roles.forEach((r) => {
    const douplicateTag = r.tags.find((a) => !!aliases.includes(a));
    if (douplicateTag) {
      log.fatal('Role tag registered twice: ', douplicateTag);
      process.exit();
    }
    aliases.push(...r.tags);

    if (names.includes(r.name)) {
      log.fatal('Role name registered twice: ', r.name);
      process.exit();
    }
    names.push(r.name);
  });
})();

//////////////////////////////////////////////////////
/// LOGIN TO DISCORD

(async () => {
  log.info(`Connecting to Discord...`);
  try {
    await client.login(Secrets.token);
  } catch (e) {
    log.fatal('Failed connecting to discord: ', e);
  }
})();
