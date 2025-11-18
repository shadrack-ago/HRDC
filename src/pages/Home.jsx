import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Shield, 
  MessageSquare, 
  Users, 
  FileText, 
  Lock, 
  Brain,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Shield,
      title: 'GDPR & Data Protection',
      description: 'Get expert guidance on GDPR compliance, data protection regulations, and privacy policies.'
    },
    {
      icon: FileText,
      title: 'Employment Law',
      description: 'Navigate complex employment laws, contracts, and workplace regulations with confidence.'
    },
    {
      icon: Brain,
      title: 'AI Systems Compliance',
      description: 'Understand AI governance, ethical AI implementation, and regulatory compliance.'
    },
    {
      icon: Lock,
      title: 'Data Security',
      description: 'Learn about data security best practices, breach protocols, and security frameworks.'
    },
    {
      icon: Users,
      title: 'HR Policies',
      description: 'Develop and refine HR policies, procedures, and workplace guidelines.'
    },
    {
      icon: MessageSquare,
      title: '24/7 Expert Chat',
      description: 'Access instant expert advice through our AI-powered consulting platform.'
    }
  ]

  const benefits = [
    'Instant access to HR and legal expertise',
    'GDPR and data protection guidance',
    'Employment law clarification',
    'AI systems compliance support',
    'Downloadable consultation reports',
    'Secure and confidential discussions'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              HR Digital Consulting
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Expert guidance on work policies, data security, AI systems, GDPR compliance, 
              and employment law - available 24/7 through our intelligent consulting platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/chat" className="bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center">
                  Start Consulting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/login" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Comprehensive HR & Legal Expertise
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Access specialized knowledge across all areas of HR, employment law, 
              data protection, and AI compliance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="gradient-bg p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Why Choose HR Digital Consulting?
              </h2>
              <p className="text-lg text-secondary-600 mb-8">
                Our platform combines cutting-edge AI technology with deep expertise 
                in HR, employment law, and data protection to provide you with 
                accurate, actionable guidance.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-secondary-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="card">
              <div className="text-center">
                <div className="gradient-bg p-4 rounded-full w-fit mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-900 mb-4">
                  Start Your Consultation
                </h3>
                <p className="text-secondary-600 mb-6">
                  Join thousands of HR professionals and managers who trust 
                  our platform for expert guidance.
                </p>
                {user ? (
                  <Link to="/chat" className="btn-primary w-full">
                    Start Chatting Now
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary w-full">
                    Create Free Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <blockquote className="text-xl text-secondary-700 mb-6">
              "HR Digital Consulting has been invaluable for our company's GDPR compliance journey. 
              The instant access to expert advice and the ability to download consultation reports 
              has streamlined our entire process."
            </blockquote>
            <div className="text-secondary-600">
              <p className="font-semibold">Sarah Johnson</p>
              <p>HR Director, TechCorp Solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Expert HR Guidance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join our platform today and get instant access to professional 
            HR and legal consulting services.
          </p>
          {user ? (
            <Link to="/dashboard" className="bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center">
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          ) : (
            <Link to="/register" className="bg-white text-primary-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center">
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
