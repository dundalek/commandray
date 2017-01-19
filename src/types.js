declare type Command = {
  name: string,
  summary: string,
  description: string,
  schema: CommandSchema, // params / arguments + somehow positional (or from synopsis)
  examples: Example[],
  source?: Object, // e.g. from manual
  // todo usage strings?
};

declare type CommandSchema = {
  usage: string,
  params: Param[],
}

declare type Param = {
  name: string, // long
  alias?: string[], // short
  summary: string,
  description: string,
  schema: JSONSchema,
  // TODO or positional parameters paramName // e.g. --app APP

  paramName?: string,
};

declare type JSONSchema = {
  type: string,
  default?: any,
};

declare type Example = Object;
