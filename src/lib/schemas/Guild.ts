import { Fields } from "quickmongo";

const GuildSchema = new Fields.ObjectField({
  verification_method: new Fields.StringField(),
  verified_role: new Fields.StringField(),
  verification_channel: new Fields.StringField(),
});

export { GuildSchema };
