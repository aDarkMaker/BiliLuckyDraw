package app

func (a *AppService) GetHistory(profileID string) (string, error) {
	return a.profile.GetHistory(profileID)
}

func (a *AppService) DeleteHistory(profileID, historyID string) error {
	return a.profile.DeleteHistory(profileID, historyID)
}

func (a *AppService) DeleteAllHistory(profileID string) error {
	return a.profile.DeleteAllHistory(profileID)
}

func (a *AppService) ExportHistory(profileID, historyID string) (string, error) {
	filename, err := a.profile.HistoryExportFilename(profileID, historyID)
	if err != nil {
		return "", err
	}

	dialog := a.app.Dialog.SaveFile().
		SetMessage("导出中奖名单").
		SetFilename(filename).
		AddFilter("Markdown", "*.md")

	path, err := dialog.PromptForSingleSelection()
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil
	}

	return a.profile.ExportHistory(profileID, historyID, path)
}
