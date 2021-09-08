import { Fields } from "quickmongo";

const GuildSchema = new Fields.ObjectField({
	/* main verified role */
  verified_role_id: new Fields.StringField(),
});

export { GuildSchema };
