import { Fields } from "quickmongo";

const UserSchema = new Fields.ObjectField({
  names: new Fields.ArrayField(new Fields.StringField()),
});

export { UserSchema };
