import { Bot, Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";

@command({
  name: "config",
  description: "edit server configuration.",
  options: [
    {
      name: "role",
      description: "role to add when user is verified",
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext, { role }: { role: string }) {
    const client = ctx.client as Bot;
    if (role) {
      /* should already exist */
      const guild_role = await ctx.guild?.roles.fetch(role);
      await ctx.reply(
        `Setting \`${guild_role?.name}\` as the "Verified Raider" role.`
      );

      client.guilds_db.set(ctx.guild?.id!, { verified_role_id: role });
    }
  }
}
