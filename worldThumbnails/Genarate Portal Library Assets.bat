@echo off
echo Going up into "14aOSC"
cd ..
echo Starting JavaScript
"C:/Program Files/nodejs/node.exe" "C:/Users/14Anthony7095/Documents/14aOSC-API-Log/myModules/genaratePortalLibraryList.js"
echo Finished with JavaScript
timeout /T 5 /nobreak>nul
echo Going down into "worldThumbnails"
cd worldThumbnails
echo Starting FFMPEG
ffmpeg -r 1 -y -i dl/%%05d.png -vcodec libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart output/thumbnail.mp4
echo Finished with FFMPEG
timeout /T 10 /nobreak>nul
echo Going down into "dl"
cd dl
echo Cleaning up downloaded files
for %%f in (*.png) do del /q %%f
timeout /T 5 /nobreak
pause