

export function DownloadCommand(url:string): string {
    return `
    yt-dlp -f "bestvideo*+bestaudio/best" --youtube-skip-dash-manifest -g "${url}" | {
        read -r video_url audio_url;
        yt-dlp -f bestvideo --external-downloader ffmpeg --external-downloader-args "ffmpeg_i:-ss 0" -o - "${url}" | ffmpeg -i pipe:0 -i <(yt-dlp -x --audio-format opus -o - "${url}") -c:v copy -c:a aac -f matroska - | mpv -
    }
    `
}