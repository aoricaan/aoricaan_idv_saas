package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func main() {
	hash := sha256.Sum256([]byte("secret-api-key"))
	fmt.Print(hex.EncodeToString(hash[:]))
}
