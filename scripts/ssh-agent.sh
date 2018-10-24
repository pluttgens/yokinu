#!/usr/bin/env bash

eval "$(ssh-agent -s)"
ssh-add -K ~/.ssh/do_rsa
