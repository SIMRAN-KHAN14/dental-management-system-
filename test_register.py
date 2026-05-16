import urllib.request, urllib.error, json

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/auth/register',
    method='POST',
    headers={'Content-Type': 'application/json'},
    data=json.dumps({'name':'test','email':'[EMAIL_ADDRESS]','password':'[PASSWORD]'}).encode('utf-8')
)

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code, e.read().decode())
except urllib.error.URLError as e:
    print("URL Error:", e.reason)
