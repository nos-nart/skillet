import type { TurboModule } from "react-native";
import { TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  scanSkillsDir(dir: string): Promise<string>;
  readSkillMd(path: string): Promise<string>;
  symlink(source: string, target: string): Promise<boolean>;
  unlink(target: string): Promise<boolean>;
  ensureDir(path: string): Promise<boolean>;
  writeTextFile(path: string, contents: string): Promise<boolean>;
  copyText(text: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>("NativeSkillsFs");
