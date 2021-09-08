import { Bot, Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { MessageActionRow, MessageSelectMenu } from "discord.js";

@command({
  name: "verify",
  description: "verify your ingame name.",
  options: [
    {
      name: "name",
      description: "name to verify under",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
})
export default class extends Command {
  public async exec(ctx: CommandContext, { name }: { name: string }) {
    await ctx.interaction.deferReply();

    const client = ctx.client as Bot;
    const users = await client.users_db.all();

    const to_verify = users.find((c) => c.ID === ctx.user.id);

    if (name) {
      if (users.find((c) => c.data.names.includes(name))) {
        await ctx.interaction.editReply(
          `You are already verified as \`${name}\`.`
        );
      } else {
        /* user exists and has given a name */
        if (to_verify) {
          await ctx.interaction.editReply(
            `you are not verified under ${name}.
          \nill do it for you`
          );

          await client.users_db.push(ctx.user.id, name, "names");
        }
      }
    } else {
      /* api error if there are duplicate names */
      const names = to_verify?.data?.names!;

      if (names) {
        const menu = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select-ign-to-verify")
            .setPlaceholder("Choose a name")
            .addOptions(names.map((c) => ({ label: c, value: c })))
        );

        await ctx.interaction.editReply({
          content:
            "Looks like you are verified in another servers, select a name to verify under.",
          components: [menu],
        });
      }
    }
  }
}
