#import "RNSkillsFs.h"

#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>

@implementation RNSkillsFs

RCT_EXPORT_MODULE(NativeSkillsFs)

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSkillsFsSpecJSI>(params);
}

- (NSString *)jsonStringFromObject:(id)object
{
  id value = object ?: [NSNull null];
  NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:nil];
  return data ? [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] : @"null";
}

- (BOOL)isSafeSlug:(NSString *)slug
{
  if (slug.length == 0 || [slug isEqualToString:@"."] || [slug isEqualToString:@".."]) {
    return NO;
  }
  if ([slug containsString:@".."] || [slug containsString:@"/"] || [slug containsString:@"\\"]) {
    return NO;
  }
  NSCharacterSet *allowed = [NSCharacterSet characterSetWithCharactersInString:@"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-"];
  return [[slug stringByTrimmingCharactersInSet:allowed] length] == 0;
}

- (void)scanSkillsDir:(NSString *)dir resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  NSString *expanded = [dir stringByExpandingTildeInPath];
  BOOL isDir = NO;
  if (![[NSFileManager defaultManager] fileExistsAtPath:expanded isDirectory:&isDir] || !isDir) {
    resolve(@"[]");
    return;
  }
  NSError *error = nil;
  NSArray<NSString *> *entries = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:expanded error:&error];
  if (!entries) {
    if (error.code == NSFileReadNoSuchFileError || error.code == NSNoSuchFileError) {
      resolve(@"[]");
      return;
    }
    reject(@"invalid_path", error.localizedDescription ?: @"Cannot scan skills directory.", error);
    return;
  }
  NSMutableArray<NSString *> *paths = [NSMutableArray arrayWithCapacity:entries.count];
  for (NSString *entry in entries) {
    if ([entry hasPrefix:@"."]) {
      continue;
    }
    [paths addObject:[expanded stringByAppendingPathComponent:entry]];
  }
  resolve([self jsonStringFromObject:paths]);
}

- (void)readSkillMd:(NSString *)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if (path.length == 0) {
    reject(@"invalid_path", @"Cannot read skill without a path.", nil);
    return;
  }
  NSError *error = nil;
  NSString *contents = [NSString stringWithContentsOfFile:[path stringByExpandingTildeInPath]
                                                 encoding:NSUTF8StringEncoding
                                                    error:&error];
  if (!contents) {
    reject(@"read_failed", error.localizedDescription ?: @"Failed to read skill file.", error);
    return;
  }
  resolve(contents);
}

- (void)symlink:(NSString *)source target:(NSString *)target resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if (![self isSafeSlug:[target lastPathComponent]]) {
    reject(@"slug_unsafe", @"Refusing to symlink to an unsafe slug path.", nil);
    return;
  }
  NSString *expandedSource = [source stringByExpandingTildeInPath];
  NSString *expandedTarget = [target stringByExpandingTildeInPath];

  NSString *parentDir = [expandedTarget stringByDeletingLastPathComponent];
  NSError *dirError = nil;
  [[NSFileManager defaultManager] createDirectoryAtPath:parentDir
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:&dirError];

  NSError *error = nil;
  [[NSFileManager defaultManager] removeItemAtPath:expandedTarget error:nil];
  BOOL ok = [[NSFileManager defaultManager] createSymbolicLinkAtPath:expandedTarget
                                                 withDestinationPath:expandedSource
                                                               error:&error];
  if (!ok) {
    reject(@"write_failed", error.localizedDescription ?: @"Failed to create symlink.", error);
    return;
  }
  resolve(@YES);
}

- (void)unlink:(NSString *)target resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if (![self isSafeSlug:[target lastPathComponent]]) {
    reject(@"slug_unsafe", @"Refusing to unlink an unsafe slug path.", nil);
    return;
  }
  NSString *expandedTarget = [target stringByExpandingTildeInPath];
  NSError *error = nil;
  BOOL ok = [[NSFileManager defaultManager] removeItemAtPath:expandedTarget error:&error];
  if (!ok && error.code != NSFileNoSuchFileError) {
    reject(@"write_failed", error.localizedDescription ?: @"Failed to remove symlink.", error);
    return;
  }
  resolve(@YES);
}

// Install surface for Task 7 `downloadSkill`: `~` expands natively (same as
// `scanSkillsDir`/`readSkillMd`), parents are created, and `..` is rejected so
// a crafted slug can never escape the skills home.
- (void)ensureDir:(NSString *)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if (path.length == 0) {
    reject(@"invalid_path", @"Cannot create directory without a path.", nil);
    return;
  }
  if ([path containsString:@".."]) {
    reject(@"slug_unsafe", @"Refusing to create a directory with '..' in its path.", nil);
    return;
  }
  NSString *expanded = [path stringByExpandingTildeInPath];
  NSError *error = nil;
  BOOL ok = [[NSFileManager defaultManager] createDirectoryAtPath:expanded
                                      withIntermediateDirectories:YES
                                                       attributes:nil
                                                            error:&error];
  if (!ok) {
    reject(@"write_failed", error.localizedDescription ?: @"Failed to create directory.", error);
    return;
  }
  resolve(@YES);
}

- (void)writeTextFile:(NSString *)path contents:(NSString *)contents resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{  if (path.length == 0) {
    reject(@"invalid_path", @"Cannot write file without a path.", nil);
    return;
  }
  if ([path containsString:@".."]) {
    reject(@"slug_unsafe", @"Refusing to write to a path containing '..'.", nil);
    return;
  }
  NSString *expanded = [path stringByExpandingTildeInPath];
  NSError *error = nil;
  [[NSFileManager defaultManager] createDirectoryAtPath:[expanded stringByDeletingLastPathComponent]
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:nil];
  BOOL ok = [[contents ?: @"" dataUsingEncoding:NSUTF8StringEncoding] writeToFile:expanded options:NSDataWritingAtomic error:&error];
  if (!ok) {
    reject(@"write_failed", error.localizedDescription ?: @"Failed to write file.", error);
    return;
  }
  resolve(@YES);
}

// Clipboard for the Prompts tab copy buttons (old `navigator.clipboard`).
- (void)copyText:(NSString *)text resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  if (text.length == 0) {
    reject(@"invalid_text", @"Cannot copy empty text.", nil);
    return;
  }
  NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
  [pasteboard clearContents];
  BOOL ok = [pasteboard setString:text forType:NSPasteboardTypeString];
  resolve(@(ok));
}

@end
