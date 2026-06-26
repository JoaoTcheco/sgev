; PharmaSys NSIS installer
; Builds a real Windows installer (.exe) that:
;  - installs PharmaSys to %LocalAppData%\Programs\PharmaSys (no admin needed)
;  - creates Start Menu and Desktop shortcuts
;  - optionally registers PharmaSys to start with Windows
;  - registers an uninstaller in Add/Remove Programs

Unicode true
!include "MUI2.nsh"
!include "FileFunc.nsh"

!define APP_NAME      "PharmaSys"
!define APP_PUBLISHER "PharmaSys"
!define APP_VERSION   "1.0.0"
!define APP_EXE       "PharmaSys.exe"
!define APP_REGKEY    "Software\Microsoft\Windows\CurrentVersion\Uninstall\PharmaSys"
!define RUN_REGKEY    "Software\Microsoft\Windows\CurrentVersion\Run"

Name "${APP_NAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\PharmaSys"
InstallDirRegKey HKCU "Software\PharmaSys" "InstallDir"
RequestExecutionLevel user
SetCompressor /SOLID lzma
ShowInstDetails show
ShowUninstDetails show
BrandingText "PharmaSys - Gestao de Farmacia"

Var StartWithWindows

!define MUI_ABORTWARNING

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
Page custom StartupPage StartupPageLeave
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "PortugueseBR"
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  StrCpy $StartWithWindows "1"
FunctionEnd

Function StartupPage
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0 100% 24u "Quer abrir o PharmaSys automaticamente ao ligar o computador?"
  Pop $0
  ${NSD_CreateCheckbox} 0 30u 100% 12u "Iniciar o PharmaSys com o Windows"
  Pop $1
  ${NSD_Check} $1
  nsDialogs::Show
FunctionEnd

Function StartupPageLeave
  ${NSD_GetState} $1 $StartWithWindows
FunctionEnd

Section "PharmaSys (obrigatorio)" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  File /r "${SRCDIR}\*.*"

  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateDirectory "$SMPROGRAMS\PharmaSys"
  CreateShortCut  "$SMPROGRAMS\PharmaSys\PharmaSys.lnk"   "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
  CreateShortCut  "$SMPROGRAMS\PharmaSys\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"
  CreateShortCut  "$DESKTOP\PharmaSys.lnk"                "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0

  WriteRegStr HKCU "Software\PharmaSys" "InstallDir" "$INSTDIR"

  WriteRegStr HKCU "${APP_REGKEY}" "DisplayName"     "${APP_NAME}"
  WriteRegStr HKCU "${APP_REGKEY}" "DisplayVersion"  "${APP_VERSION}"
  WriteRegStr HKCU "${APP_REGKEY}" "Publisher"       "${APP_PUBLISHER}"
  WriteRegStr HKCU "${APP_REGKEY}" "DisplayIcon"     "$INSTDIR\${APP_EXE}"
  WriteRegStr HKCU "${APP_REGKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${APP_REGKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${APP_REGKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${APP_REGKEY}" "NoRepair" 1

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "${APP_REGKEY}" "EstimatedSize" "$0"

  StrCmp $StartWithWindows "1" 0 +2
    WriteRegStr HKCU "${RUN_REGKEY}" "PharmaSys" '"$INSTDIR\${APP_EXE}"'
SectionEnd

Section "Uninstall"
  DeleteRegValue HKCU "${RUN_REGKEY}" "PharmaSys"
  DeleteRegKey   HKCU "${APP_REGKEY}"
  DeleteRegKey   HKCU "Software\PharmaSys"

  Delete "$DESKTOP\PharmaSys.lnk"
  Delete "$SMPROGRAMS\PharmaSys\PharmaSys.lnk"
  Delete "$SMPROGRAMS\PharmaSys\Desinstalar.lnk"
  RMDir  "$SMPROGRAMS\PharmaSys"

  RMDir /r "$INSTDIR"
SectionEnd
