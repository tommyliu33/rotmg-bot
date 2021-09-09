import { Fields } from "quickmongo";

const GuildSchema = new Fields.ObjectField({
  /* main verified role */
  verified_role: new Fields.StringField(),
  verification_channel: new Fields.StringField(),
});

export { GuildSchema };
