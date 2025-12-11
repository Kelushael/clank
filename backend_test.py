import requests
import json
import sys
import time
from datetime import datetime
import websocket
import threading

class NexusAPITester:
    def __init__(self, base_url="https://local-nexus-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.conversation_id = None
        self.ws_messages = []

    def run_test(self, name, method, endpoint, expected_status, data=None, timeout=10):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_conversation(self):
        """Test creating a new conversation"""
        success, response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            data={"title": "Test Chat", "model_provider": "cloud"}
        )
        if success and 'id' in response:
            self.conversation_id = response['id']
            print(f"   Created conversation ID: {self.conversation_id}")
            return True
        return False

    def test_get_conversations(self):
        """Test getting all conversations"""
        success, response = self.run_test(
            "Get Conversations",
            "GET",
            "conversations",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} conversations")
            return True
        return False

    def test_get_conversation(self):
        """Test getting a specific conversation"""
        if not self.conversation_id:
            print("❌ No conversation ID available")
            return False
        
        success, response = self.run_test(
            "Get Specific Conversation",
            "GET",
            f"conversations/{self.conversation_id}",
            200
        )
        return success and 'id' in response

    def test_identity_endpoint(self):
        """Test identity endpoint"""
        success, response = self.run_test(
            "Get Identity",
            "GET",
            "identity",
            200
        )
        return success and 'id' in response

    def test_commander_execute(self):
        """Test commander execute endpoint"""
        success, response = self.run_test(
            "Commander Execute",
            "POST",
            "commander/execute",
            200,
            data={"command": "echo 'Hello NEXUS'"}
        )
        if success and 'stdout' in response:
            print(f"   Command output: {response.get('stdout', '').strip()}")
            return True
        return False

    def test_commander_file_operations(self):
        """Test commander file operations"""
        # Test list operation
        success1, response1 = self.run_test(
            "Commander File List",
            "POST",
            "commander/file",
            200,
            data={"operation": "list", "path": "."}
        )
        
        # Test write operation
        success2, response2 = self.run_test(
            "Commander File Write",
            "POST",
            "commander/file",
            200,
            data={"operation": "write", "path": "test.txt", "content": "Hello NEXUS"}
        )
        
        # Test read operation
        success3, response3 = self.run_test(
            "Commander File Read",
            "POST",
            "commander/file",
            200,
            data={"operation": "read", "path": "test.txt"}
        )
        
        return success1 and success2 and success3

    def test_websocket_connection(self):
        """Test WebSocket connection and messaging"""
        if not self.conversation_id:
            print("❌ No conversation ID available for WebSocket test")
            return False

        print(f"\n🔍 Testing WebSocket Connection...")
        
        try:
            ws_url = self.base_url.replace('https', 'wss') + f"/api/ws/chat/{self.conversation_id}"
            print(f"   WebSocket URL: {ws_url}")
            
            def on_message(ws, message):
                data = json.loads(message)
                self.ws_messages.append(data)
                print(f"   WebSocket received: {data.get('type', 'unknown')}")
                if data.get('type') == 'stream':
                    print(f"   Content: {data.get('content', '')[:50]}...")

            def on_error(ws, error):
                print(f"   WebSocket error: {error}")

            def on_close(ws, close_status_code, close_msg):
                print(f"   WebSocket closed")

            def on_open(ws):
                print(f"   WebSocket connected")
                # Send a test message
                test_message = {
                    "message": "Hello NEXUS, this is a test message",
                    "model_provider": "cloud"
                }
                ws.send(json.dumps(test_message))
                print(f"   Sent test message")

            ws = websocket.WebSocketApp(ws_url,
                                      on_open=on_open,
                                      on_message=on_message,
                                      on_error=on_error,
                                      on_close=on_close)
            
            # Run WebSocket in a thread with timeout
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for messages
            time.sleep(10)  # Wait for AI response
            ws.close()
            
            if len(self.ws_messages) > 0:
                print(f"✅ WebSocket test passed - Received {len(self.ws_messages)} messages")
                return True
            else:
                print(f"❌ WebSocket test failed - No messages received")
                return False
                
        except Exception as e:
            print(f"❌ WebSocket test failed - Error: {str(e)}")
            return False

    def test_delete_conversation(self):
        """Test deleting a conversation"""
        if not self.conversation_id:
            print("❌ No conversation ID available")
            return False
        
        success, response = self.run_test(
            "Delete Conversation",
            "DELETE",
            f"conversations/{self.conversation_id}",
            200
        )
        return success

def main():
    print("🚀 Starting NEXUS Backend API Tests")
    print("=" * 50)
    
    tester = NexusAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Create Conversation", tester.test_create_conversation),
        ("Get Conversations", tester.test_get_conversations),
        ("Get Specific Conversation", tester.test_get_conversation),
        ("Identity Endpoint", tester.test_identity_endpoint),
        ("Commander Execute", tester.test_commander_execute),
        ("Commander File Operations", tester.test_commander_file_operations),
        ("WebSocket Messaging", tester.test_websocket_connection),
        ("Delete Conversation", tester.test_delete_conversation),
    ]
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                print(f"⚠️  Test '{test_name}' failed, continuing with other tests...")
        except Exception as e:
            print(f"❌ Test '{test_name}' crashed: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Backend Tests Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())