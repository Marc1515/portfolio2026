export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export%20{};",
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    const sourcePath = /\.[cm]?[jt]s$/.test(relativePath)
      ? relativePath
      : `${relativePath}.ts`;
    return {
      url: new URL(`../src/${sourcePath}`, import.meta.url).href,
      format: "module-typescript",
      shortCircuit: true,
    };
  }

  if (
    context.parentURL?.endsWith(".ts") &&
    specifier.startsWith(".") &&
    !/\.[cm]?[jt]s$/.test(specifier)
  ) {
    return {
      url: new URL(`${specifier}.ts`, context.parentURL).href,
      format: "module-typescript",
      shortCircuit: true,
    };
  }

  const resolved = await nextResolve(specifier, context);
  return resolved.url.endsWith(".ts")
    ? { ...resolved, format: "module-typescript" }
    : resolved;
}
