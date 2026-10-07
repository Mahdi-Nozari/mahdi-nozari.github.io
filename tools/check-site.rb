# frozen_string_literal: true

# Keep the deployment checks identical on Windows and Linux. HTML-Proofer's
# libcurl dependency can use the DLL already supplied by Git for Windows.
ENV.delete('DEBUG')

if Gem.win_platform?
  require 'fiddle/import'
  require 'ffi'

  candidates = [
    ENV['LIBCURL_PATH'],
    File.join(ENV.fetch('ProgramFiles', 'C:/Program Files'), 'Git/mingw64/bin/libcurl-4.dll'),
    File.join(RbConfig::CONFIG['prefix'], 'msys64/ucrt64/bin/libcurl-4.dll')
  ].compact
  curl_path = candidates.find { |path| File.file?(path) }

  if curl_path
    module SiteCheckDll
      extend Fiddle::Importer
      dlload 'kernel32'
      extern 'int SetDllDirectoryA(char*)'
    end
    SiteCheckDll.SetDllDirectoryA(File.dirname(curl_path))

    curl_override = Module.new do
      define_method(:ffi_lib) do |*libraries|
        libraries = libraries.map do |library|
          library == ['libcurl', 'libcurl.so.4'] ? curl_path : library
        end
        super(*libraries)
      end
    end
    FFI::Library.prepend(curl_override)
  end
end

require 'html-proofer'

HTMLProofer.check_directory(
  ARGV.fetch(0, '_site'),
  disable_external: true,
  ignore_urls: [%r{^http://(?:127\.0\.0\.1|0\.0\.0\.0|localhost)}]
).run
