
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing or using Social Assistance AI (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Social Assistance AI is an AI-powered platform that helps users create, manage, and schedule social media content. The Service includes both free and paid subscription tiers with varying features and usage limits. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Account Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be responsible for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Be at least 18 years old to create an account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Subscription Plans and Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Free Plan</h3>
                <p className="text-muted-foreground">
                  Our Free plan provides limited access to the Service with usage restrictions. We may change or discontinue the Free plan at any time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Paid Subscriptions</h3>
                <p className="text-muted-foreground">
                  Paid subscriptions (Starter and Pro plans) are billed on a recurring basis. By subscribing, you authorize us to charge your payment method at the start of each billing period. All fees are non-refundable except as required by law.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Cancellation</h3>
                <p className="text-muted-foreground">
                  You may cancel your subscription at any time through the customer portal. Cancellations take effect at the end of the current billing period. You will retain access to paid features until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Price Changes</h3>
                <p className="text-muted-foreground">
                  We reserve the right to change our pricing. Price changes for existing subscribers will be communicated at least 30 days in advance.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Usage Limits and Restrictions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Attempt to circumvent usage limits or restrictions</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to generate spam, malicious, or harmful content</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use automated tools to access the Service without authorization</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Harvest or collect user information without consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Content Ownership and Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Your Content</h3>
                <p className="text-muted-foreground">
                  You retain all rights to the content you create using our Service. By using the Service, you grant us a license to process, store, and display your content solely for the purpose of providing the Service to you.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI-Generated Content</h3>
                <p className="text-muted-foreground">
                  Content generated by our AI is provided to you for your use. However, you are responsible for reviewing and ensuring that all generated content complies with applicable laws, third-party rights, and platform policies before publishing.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Content</h3>
                <p className="text-muted-foreground">
                  The Service, including its design, features, and underlying technology, is owned by us and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. AI Content Disclaimer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our Service uses artificial intelligence to generate content. While we strive for accuracy and quality, AI-generated content may contain errors, inaccuracies, or inappropriate material. You are solely responsible for reviewing, editing, and approving all content before use. We make no warranties about the accuracy, reliability, or appropriateness of AI-generated content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our Service may integrate with third-party platforms and services (such as social media platforms). Your use of these third-party services is subject to their own terms and policies. We are not responsible for the availability, content, or practices of third-party services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Disclaimers and Limitations of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Indemnification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless Social Assistance AI and its affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Governing Law and Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will provide notice of material changes by posting the updated Terms on our website and updating the &quot;Last updated&quot; date. Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>14. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us through our support page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
