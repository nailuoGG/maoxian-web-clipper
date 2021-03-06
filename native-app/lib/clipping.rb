require_relative 'fileutils_hacked'
require_relative 'log'

module Clipping

  # msg: {:asset_folder, :clip_id, :path}
  def self.delete(root, msg)
    path       = msg.fetch('path')
    clip_id    = msg.fetch('clip_id')
    asset_folder = msg.fetch('asset_folder')

    root = sanitize(root)
    path = sanitize(path)
    asset_folder = sanitize(asset_folder)

    if path_overflow?(root, path)
      return { ok: false, message: 'clipping.op-error.path-overflow' }
    else
      if File.exist?(path)
        clipping_folder = File.dirname(path)
        isSucc, msg = try_perform { FileUtils.remove_dir(clipping_folder) }
        if !isSucc
          return {ok: false, message: msg}
        end
        remove_empty_pdir(root, clipping_folder)
        if path_overflow?(clipping_folder, asset_folder)
          # asset_folder is outside of clipping_folder
          if path_overflow?(root, asset_folder)
            return {ok: true, message: 'clipping.op-warning.asset-folder-overflow' }
          else
            if File.exist?(asset_folder)
              pattern = [asset_folder, "#{clip_id}-*"].join("/")
              Dir.glob(pattern) do |f|
                try_perform { FileUtils.rm f }
              end
            end
            return {ok: true, clip_id: clip_id}
          end
        else
          # asset_folder is inside of clipping_folder
          return {ok: true, clip_id: clip_id}
        end
      else
        return { ok: false, message: 'clipping.op-error.path-not-exist' }
      end
    end

  end

  private

  def self.try_perform
    begin
      yield
      return [true, '']
    rescue => err
      Log.warn err
      return [false, err]
    end
  end

  def self.remove_empty_pdir(root, path)
    pdir = File.dirname(path)
    return if root == pdir
    return if path_overflow?(root, pdir)
    if is_dir_empty?(pdir)
      Dir.rmdir(pdir)
      remove_empty_pdir(root, pdir)
    end
  end

  def self.is_dir_empty?(path)
    # Dir.empty?(path) not support in ruby 2.3
    Dir.entries(path).reject{|n| '.' == n || '..' == n}.size == 0
  end

  def self.sanitize(path)
    return path.gsub("\\", "/")
  end

  def self.path_overflow?(root, path)
    return path.index(root) != 0
  end

end
