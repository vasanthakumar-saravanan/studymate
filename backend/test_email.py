#!/usr/bin/env python3
"""
Simple test script to verify email configuration and functionality
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gmail_config():
    """Test if Gmail credentials are configured"""
    print("=" * 60)
    print("TESTING GMAIL CONFIGURATION")
    print("=" * 60)
    
    gmail_email = os.getenv("GMAIL_EMAIL")
    gmail_password = os.getenv("GMAIL_PASSWORD")
    
    print(f"\n✓ Checking .env file...")
    print(f"  GMAIL_EMAIL: {gmail_email if gmail_email else '❌ NOT SET'}")
    print(f"  GMAIL_PASSWORD: {'✓ SET' if gmail_password else '❌ NOT SET'}")
    
    if not gmail_email or not gmail_password:
        print("\n❌ ERROR: Gmail credentials not configured!")
        print("   Add to backend/.env:")
        print("   GMAIL_EMAIL=your.email@gmail.com")
        print("   GMAIL_PASSWORD=xxxx xxxx xxxx xxxx")
        return False
    
    return True


def test_gmail_connection(gmail_email, gmail_password):
    """Test if we can connect to Gmail SMTP"""
    print("\n" + "=" * 60)
    print("TESTING GMAIL SMTP CONNECTION")
    print("=" * 60)
    
    try:
        print(f"\n✓ Connecting to smtp.gmail.com:465...")
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5)
        print(f"  ✓ Connection successful!")
        
        print(f"\n✓ Logging in with: {gmail_email}")
        server.login(gmail_email, gmail_password)
        print(f"  ✓ Login successful!")
        
        server.quit()
        print(f"\n✓ Connection closed")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"  ❌ LOGIN FAILED!")
        print(f"  Reasons:")
        print(f"  1. Wrong email or password")
        print(f"  2. Using regular password instead of App Password")
        print(f"  3. 2-Step Verification not enabled")
        return False
    
    except Exception as e:
        print(f"  ❌ CONNECTION FAILED: {str(e)}")
        print(f"  Check internet connection or firewall")
        return False


def test_send_email(gmail_email, gmail_password, recipient_email):
    """Test sending an email"""
    print("\n" + "=" * 60)
    print(f"TESTING EMAIL SEND")
    print("=" * 60)
    
    try:
        print(f"\n✓ Creating email message...")
        
        email_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #22c55e;">✅ Test Email from StudyMate!</h2>
            <p>If you're reading this, emails are working correctly!</p>
            <p>Your StudyMate planner will now send you task completion notifications.</p>
            <p style="color: #999; font-size: 12px;">
              Sent at: {os.popen('date').read().strip()}
            </p>
          </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = "✅ StudyMate Test Email"
        message["From"] = gmail_email
        message["To"] = recipient_email
        
        part = MIMEText(email_body, "html")
        message.attach(part)
        
        print(f"  ✓ Email message created")
        
        print(f"\n✓ Sending email to {recipient_email}...")
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=5)
        server.login(gmail_email, gmail_password)
        server.sendmail(gmail_email, recipient_email, message.as_string())
        server.quit()
        
        print(f"  ✓ Email sent successfully!")
        print(f"\n📧 Check your inbox for the test email")
        print(f"   (Also check SPAM/JUNK folder)")
        return True
        
    except Exception as e:
        print(f"  ❌ FAILED TO SEND: {str(e)}")
        return False


def main():
    print("\n")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║  StudyMate Email Configuration Tester                    ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    
    # Test 1: Check configuration
    config_ok = test_gmail_config()
    if not config_ok:
        return
    
    gmail_email = os.getenv("GMAIL_EMAIL")
    gmail_password = os.getenv("GMAIL_PASSWORD")
    
    # Test 2: Test connection
    connection_ok = test_gmail_connection(gmail_email, gmail_password)
    if not connection_ok:
        print("\n❌ Cannot connect to Gmail. Check credentials and try again.")
        return
    
    # Test 3: Send test email
    print("\n" + "=" * 60)
    recipient = input("Enter recipient email to test (press Enter to use same email): ").strip()
    if not recipient:
        recipient = gmail_email
    
    email_ok = test_send_email(gmail_email, gmail_password, recipient)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    if config_ok and connection_ok and email_ok:
        print("✅ ALL TESTS PASSED!")
        print("\nYour StudyMate email notifications should work!")
        print("Go to http://localhost:8000/planner.html and test it!")
    else:
        print("❌ SOME TESTS FAILED!")
        print("\nPlease check the errors above and try again.")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
