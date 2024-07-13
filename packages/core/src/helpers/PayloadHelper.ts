export const transferPayloadToV2 = (payload: any): any => {
  console.log(payload, typeof payload);
  if (payload.arguments) {
    return {
      function: payload.function,
      functionArguments: payload.arguments,
      typeArguments: payload.type_arguments,
    };
  }

  if (payload.functionArguments) {
    return payload;
  }

  return null;
};

