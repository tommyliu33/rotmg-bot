import { Command, command, CommandContext } from "@lib";
import { ApplicationCommandOptionType } from "discord-api-types/v9";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";

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
  public async exec(ctx: CommandContext) {
    await ctx.interaction.deferReply();

    const name = ctx.interaction?.options?.getString("name");

    const { client } = ctx;
    const users = await client.users_db.all();

    const to_verify = users.find((c) => c.ID === ctx.user.id);

    // TODO: most responses should be ephemeral
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
        } else {
          console.log(`${ctx.user.tag} does not exist`);
          await ctx;
        }
      }
    } else {
      /* api error if there are duplicate names */
      const names = to_verify?.data?.names!;

      if (names) {
        const menu = new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setCustomId("select-ign-to-verify")
            .addOptions(names.map((c) => ({ label: c, value: c })))
        );

        const embed = new MessageEmbed().setDescription(
          "Select a name to verify as."
        );

        await ctx.interaction.editReply({
          embeds: [embed],
          components: [menu],
        });
      }

      // TODO: goto dms and setup
      if (!to_verify) {
        await ctx.interaction.editReply("you are here.");

        const dm_channel = await ctx.user.createDM();
        const collected = await dm_channel.awaitMessages();

        await dm_channel.send(
          "Starting your verification process. Enter your `In-game name` below."
        );

        if (collected.size) {
          console.log("we received messages", collected);
        } else {
          console.log("they did not do anything.", collected);
        }
      }
    }
  }
}
