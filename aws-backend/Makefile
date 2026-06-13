.PHONY: build-ReturnInterceptFunction

build-ReturnInterceptFunction:
	GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o $(ARTIFACTS_DIR)/bootstrap return-intercept/main.go
