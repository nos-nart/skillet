require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))
Pod::Spec.new do |s|
  s.name = "RNSkillsFs"
  s.version = package["version"]
  s.summary = "Skillet skills filesystem bindings"
  s.license = { :type => "MIT" }
  s.author = "Skillet"
  s.homepage = "https://skillet"
  s.source = { :path => "." }
  s.platforms = { :ios => "15.0", :osx => "14.0" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.dependency "React-Core"
  s.dependency "ReactCodegen"
end
