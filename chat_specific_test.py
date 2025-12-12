import requests
import json
import websocket
import threading
import time

class ChatFunctionalityTester:
    def __init__(self, base_url="https://hybrid-brain.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.conversation_id = None
        self.ws_messages = []
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def test_create_conversation(self):
        """Test creating a new conversation via POST /api/conversations"""
        print("\n🔍 Test 1: Create new conversation")
        try:
            url = f"{self.api_url}/conversations"
            data = {"title": "Fibonacci Test Chat", "model_provider": "cloud"}
            response = requests.post(url, json=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if 'id' in result:
                    self.conversation_id = result['id']
                    self.log_result("Create Conversation", True, f"Created conversation ID: {self.conversation_id}")
                    return True
                else:
                    self.log_result("Create Conversation", False, "No ID in response")
                    return False
            else:
                self.log_result("Create Conversation", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Create Conversation", False, f"Error: {str(e)}")
            return False

    def test_websocket_fibonacci(self):
        """Test WebSocket chat with fibonacci function request"""
        if not self.conversation_id:
            self.log_result("WebSocket Fibonacci Test", False, "No conversation ID available")
            return False

        print(f"\n🔍 Test 2: WebSocket chat - Fibonacci function request")
        
        try:
            ws_url = self.base_url.replace('https', 'wss') + f"/api/ws/chat/{self.conversation_id}"
            print(f"   Connecting to: {ws_url}")
            
            self.ws_messages = []
            response_complete = False
            has_code = False
            
            def on_message(ws, message):
                try:
                    data = json.loads(message)
                    self.ws_messages.append(data)
                    print(f"   Received: {data.get('type', 'unknown')}")
                    
                    if data.get('type') == 'stream':
                        content = data.get('content', '')
                        print(f"   Content chunk: {content[:100]}...")
                        # Check if response contains code (python function)
                        if 'def' in content.lower() and 'fibonacci' in content.lower():
                            nonlocal has_code
                            has_code = True
                    elif data.get('type') == 'done':
                        nonlocal response_complete
                        response_complete = True
                        ws.close()
                except Exception as e:
                    print(f"   Error parsing message: {e}")

            def on_error(ws, error):
                print(f"   WebSocket error: {error}")

            def on_close(ws, close_status_code, close_msg):
                print(f"   WebSocket closed")

            def on_open(ws):
                print(f"   WebSocket connected")
                # Send the specific fibonacci request
                test_message = {
                    "message": "write a python function to calculate fibonacci",
                    "model_provider": "cloud"
                }
                ws.send(json.dumps(test_message))
                print(f"   Sent fibonacci request")

            ws = websocket.WebSocketApp(ws_url,
                                      on_open=on_open,
                                      on_message=on_message,
                                      on_error=on_error,
                                      on_close=on_close)
            
            # Run WebSocket in a thread
            ws_thread = threading.Thread(target=ws.run_forever)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for response (up to 15 seconds)
            timeout = 15
            start_time = time.time()
            while not response_complete and (time.time() - start_time) < timeout:
                time.sleep(0.5)
            
            if not response_complete:
                ws.close()
            
            # Analyze results
            if len(self.ws_messages) > 0 and response_complete:
                if has_code:
                    self.log_result("WebSocket Fibonacci Test", True, 
                                  f"Received {len(self.ws_messages)} messages with code response")
                else:
                    self.log_result("WebSocket Fibonacci Test", True, 
                                  f"Received {len(self.ws_messages)} messages but no code detected")
                return True
            else:
                self.log_result("WebSocket Fibonacci Test", False, 
                              f"Incomplete response - messages: {len(self.ws_messages)}, complete: {response_complete}")
                return False
                
        except Exception as e:
            self.log_result("WebSocket Fibonacci Test", False, f"Error: {str(e)}")
            return False

    def test_conversation_persistence(self):
        """Test conversation persistence - fetch conversations and verify messages"""
        print(f"\n🔍 Test 3: Conversation persistence")
        
        try:
            # Test GET /api/conversations
            url = f"{self.api_url}/conversations"
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Fetch Conversations", False, f"Status: {response.status_code}")
                return False
            
            conversations = response.json()
            if not isinstance(conversations, list):
                self.log_result("Fetch Conversations", False, "Response is not a list")
                return False
            
            # Find our test conversation
            test_convo = None
            for convo in conversations:
                if convo.get('id') == self.conversation_id:
                    test_convo = convo
                    break
            
            if not test_convo:
                self.log_result("Conversation Persistence", False, "Test conversation not found in list")
                return False
            
            # Check if conversation has messages
            messages = test_convo.get('messages', [])
            if len(messages) >= 2:  # Should have user message and assistant response
                user_messages = [m for m in messages if m.get('role') == 'user']
                assistant_messages = [m for m in messages if m.get('role') == 'assistant']
                
                if len(user_messages) > 0 and len(assistant_messages) > 0:
                    self.log_result("Conversation Persistence", True, 
                                  f"Found conversation with {len(messages)} messages ({len(user_messages)} user, {len(assistant_messages)} assistant)")
                    return True
                else:
                    self.log_result("Conversation Persistence", False, 
                                  f"Messages found but wrong roles - user: {len(user_messages)}, assistant: {len(assistant_messages)}")
                    return False
            else:
                self.log_result("Conversation Persistence", False, 
                              f"Not enough messages - expected >=2, got {len(messages)}")
                return False
                
        except Exception as e:
            self.log_result("Conversation Persistence", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all chat functionality tests"""
        print("🚀 Starting NEXUS Chat Functionality Tests")
        print("=" * 60)
        
        # Run tests in sequence
        success1 = self.test_create_conversation()
        success2 = self.test_websocket_fibonacci() if success1 else False
        success3 = self.test_conversation_persistence() if success2 else False
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 Chat Functionality Test Results:")
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"   {status} {result['test']}")
            if result['details']:
                print(f"      {result['details']}")
        
        print(f"\n   Tests Passed: {passed}/{total}")
        print(f"   Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        if passed == total:
            print("🎉 All chat functionality tests passed!")
            return True
        else:
            print("⚠️  Some chat functionality tests failed")
            return False

def main():
    tester = ChatFunctionalityTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())