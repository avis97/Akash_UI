#!/bin/bash
curl -s -L -c cookies.txt https://blanchedalmond-bat-253605.hostingersite.com/ > login.html
TOKEN=$(grep -o '<input name="_token" type="hidden" value="[^"]*"' login.html | sed 's/.*value="\([^"]*\)".*/\1/')

curl -s -c cookies.txt -b cookies.txt -i -X POST \
  -d "_token=$TOKEN" \
  -d "email=company@example.com" \
  -d "password=1234" \
  https://blanchedalmond-bat-253605.hostingersite.com/login > login_response.txt

curl -s -c cookies.txt -b cookies.txt https://blanchedalmond-bat-253605.hostingersite.com/employee > employee.html

echo "Employee title:"
grep -o '<title>.*</title>' employee.html
