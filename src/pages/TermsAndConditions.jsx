import React from 'react'
import { Shield, AlertTriangle, Users, CreditCard, Ban, RefreshCw, Eye, FileText } from 'lucide-react'

const TermsAndConditions = () => {
  const lastUpdated = "January 18, 2026"

  const sections = [
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Data Accuracy and Compliance",
      content: [
        "While HR Digital Consulting values accuracy and compliance in all data provided through our system, we cannot guarantee that data sources are 100% accurate, complete, or current.",
        "Users are responsible for verifying and validating any data before consuming or making decisions based on such information.",
        "We strongly recommend conducting independent verification and due diligence before utilizing any data for critical business decisions."
      ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "No Warranty",
      content: [
        "HR Digital Consulting provides our system 'as is' without any warranties, express or implied.",
        "We make no representations or warranties regarding the accuracy, reliability, completeness, or timeliness of our services.",
        "We disclaim all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement."
      ]
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: "Price and Software Updates",
      content: [
        "We reserve the right to modify pricing plans, subscription fees, and software features at any time without prior notice.",
        "Changes to our pricing structure will be effective immediately upon posting on our platform.",
        "Software updates, feature additions, or removals may be implemented without prior notification to users."
      ]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Subscription and Usage Terms",
      content: [
        "Our subscriptions are intended for individual use only. Each account is for single-user access.",
        "Enterprise or organizational use requires explicit written consent and custom enterprise agreements.",
        "Sharing account credentials or using individual subscriptions for multiple users is strictly prohibited.",
        "Unauthorized enterprise usage may result in immediate account termination without refund."
      ]
    },
    {
      icon: <Ban className="h-5 w-5" />,
      title: "System Integrity and Security",
      content: [
        "Any attempt to tamper with, reverse engineer, decompile, or otherwise alter our system without explicit written permission is strictly prohibited.",
        "Unauthorized access attempts, data scraping, or efforts to compromise system integrity will be prosecuted to the fullest extent of applicable law.",
        "We reserve the right to pursue legal action, including criminal charges, against individuals or entities attempting to breach our system security."
      ]
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "No Refund Policy",
      content: [
        "All payments made for subscriptions, services, or features are non-refundable.",
        "No refunds will be issued for partial subscription periods, unused features, or service dissatisfaction.",
        "In cases of billing errors or unauthorized charges, we will investigate and resolve according to our payment processor policies."
      ]
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: "Account Usage and Monitoring",
      content: [
        "Users are prohibited from creating multiple trial accounts to circumvent usage limitations or payment requirements.",
        "We actively monitor for fraudulent account creation and abuse of trial periods.",
        "Violations may result in immediate account suspension, permanent banning, and potential legal action.",
        "We reserve the right to terminate accounts engaging in suspicious or fraudulent activities without notice."
      ]
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Limitation of Liability",
      content: [
        "HR Digital Consulting shall not be liable for any indirect, incidental, special, consequential, or punitive damages.",
        "Our total liability for any claims arising from the use of our services shall not exceed the amount paid by the user in the preceding three (3) months.",
        "Users agree to indemnify and hold harmless HR Digital Consulting from any claims, damages, or expenses arising from their use of our services."
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-secondary-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="gradient-bg p-3 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-secondary-900 mb-4">
            Terms and Conditions
          </h1>
          <p className="text-secondary-600 text-lg">
            Please read these terms carefully before using HR Digital Consulting services
          </p>
          <p className="text-sm text-secondary-500 mt-2">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-secondary-900 mb-4">
            Agreement to Terms
          </h2>
          <p className="text-secondary-600 leading-relaxed">
            By accessing and using HR Digital Consulting services, you acknowledge that you have read, 
            understood, and agree to be bound by these Terms and Conditions. If you do not agree to 
            these terms, you must not use our services. These terms constitute a legally binding 
            agreement between you and HR Digital Consulting.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start space-x-4">
                <div className="gradient-bg p-2 rounded-lg text-white flex-shrink-0">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                    {section.title}
                  </h3>
                  <ul className="space-y-3">
                    {section.content.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start">
                        <span className="text-primary-500 mt-1 mr-3 flex-shrink-0">•</span>
                        <span className="text-secondary-600 leading-relaxed">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-8 mt-8">
          <h3 className="text-xl font-semibold text-secondary-900 mb-4">
            Questions or Concerns
          </h3>
          <p className="text-secondary-600 mb-4">
            If you have any questions about these Terms and Conditions, please contact our legal team:
          </p>
          <div className="space-y-2 text-secondary-700">
            <p><strong>Email:</strong> info@hrdigitalconsultingltd.com</p>
            <p><strong>Phone:</strong> +254768322488 / +254 758 723112 </p>
            <p><strong>Address:</strong> Thika Road, Phileo Arcade 1st floor, Nairobi</p>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="text-center mt-12 text-sm text-secondary-500">
          <p>
            These terms may be updated periodically. Continued use of our services constitutes 
            acceptance of any modified terms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
