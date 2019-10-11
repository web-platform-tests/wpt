package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"golang.org/x/oauth2/google"
	"google.golang.org/appengine/remote_api"
	"google.golang.org/appengine/search"
)

var (
	remoteAPIHost = flag.String("remote_api_host", "localhost:9999", "local dev_appserver.py host for the remote API")
	dryRun        = flag.Bool("dry_run", false, "don't actually commit to the index")
)

var blacklist = regexp.MustCompile("^/(" + strings.Join([]string{
	`[^/]*$`,   // Ignore all the files immediately in the root
	`.*\.png$`, // No text in images.
	`.*META.yml$`,
	`.cache/`,
	`.git/`,
	`.github/`,
	`.vscode/`,
	`.mypy_cache/`,
	`.well-known/`,
	`tools/`,
	`resources/`,
}, "|") + ")")

type WTPFile struct {
	Path    string
	Content string
}

func main() {
	flag.Parse()

	ctx, err := getRemoteAPIContext()
	if err != nil {
		panic(err.Error())
	}
	index, err := search.Open("test-content")
	if err != nil {
		panic(err.Error())
	}

	err = filepath.Walk("../../../.",
		func(relPath string, info os.FileInfo, err error) error {
			if info.IsDir() {
				return nil
			}
			path := strings.Replace(relPath, "../../../", "/", 1)
			if err != nil {
				return err
			}
			if blacklist.MatchString(path) {
				fmt.Println("Skipping "+path, info.Size())
				return nil
			}
			fmt.Println(path, info.Size())
			contents, err := ioutil.ReadFile(relPath)
			if err != nil {
				log.Printf("Error reading %s\n", path)
			}
			if !*dryRun {
				_, err = index.Put(ctx, path, &WTPFile{
					Path:    path,
					Content: string(contents),
				})
				if err != nil {
					log.Printf("Error storing search atom: %s", err.Error())
				}
			}
			return nil
		})
	if err != nil {
		log.Println(err)
	}
}

func getRemoteAPIContext() (context.Context, error) {
	hc, err := google.DefaultClient(
		context.Background(),
		"https://www.googleapis.com/auth/appengine.apis",
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/cloud-platform",
	)
	if err != nil {
		return nil, err
	}
	remoteContext, err := remote_api.NewRemoteContext(*remoteAPIHost, hc)
	return remoteContext, err
}
