import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Recycle, 
  Users, 
  MapPin, 
  Star, 
  TrendingUp, 
  Leaf, 
  Shield, 
  MessageSquare,
  ArrowRight,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [impactStats, setImpactStats] = useState<any>(null);
  const [impactLoading, setImpactLoading] = useState(true);
  const [impactError, setImpactError] = useState('');

  useEffect(() => {
    const fetchImpact = async () => {
      setImpactLoading(true);
      setImpactError('');
      try {
        const res = await fetch('http://localhost:5000/api/users/impact-stats');
        const data = await res.json();
        setImpactStats(data);
      } catch (e) {
        setImpactError('Failed to load impact stats');
      } finally {
        setImpactLoading(false);
      }
    };
    fetchImpact();
  }, []);

  const features = [
    {
      icon: Recycle,
      title: 'Smart Recycling',
      description: 'AI-powered categorization helps you identify and list recyclable materials efficiently.'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with local recyclers, collectors, and eco-conscious individuals in your area.'
    },
    {
      icon: MapPin,
      title: 'Location Based',
      description: 'Find opportunities near you with our advanced location filtering and mapping.'
    },
    {
      icon: Shield,
      title: 'Trusted Platform',
      description: 'Verified users, secure transactions, and community ratings ensure safe trading.'
    }
  ];

  const stats = impactStats ? [
    { number: impactStats.totalItems ?? '-', label: 'Items Recycled', icon: Recycle },
    { number: impactStats.totalUsers ?? '-', label: 'Active Users', icon: Users },
    { number: impactStats.totalTrades ?? '-', label: 'Trades Completed', icon: TrendingUp },
    { number: impactStats.estimatedWasteKg ? `${impactStats.estimatedWasteKg} kg` : '-', label: 'Waste Diverted', icon: Leaf }
  ] : [];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Environmental Activist',
      content: 'EcoTrade has revolutionized how our community approaches waste management. It\'s incredibly easy to use!',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Local Recycler',
      content: 'As a recycling business owner, this platform has helped me connect with so many more people in my area.',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 5
    },
    {
      name: 'Emma Wilson',
      role: 'Sustainability Coordinator',
      content: 'The real-time chat feature makes coordinating pickups so much simpler. Great platform!',
      avatar: 'https://images.pexels.com/photos/762080/pexels-photo-762080.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-white/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf className="h-4 w-4 mr-2" />
              Building a Sustainable Future Together
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Turn Your Waste into
              <span className="text-green-600"> Someone's Treasure</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join the circular economy revolution. Connect with your community to trade, donate, 
              and recycle materials responsibly while making a positive environmental impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  to="/marketplace"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                >
                  Explore Marketplace
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              )}
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center" onClick={() => setShowDemoModal(true)}>
                <Play className="h-5 w-5 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {impactLoading ? (
            <div className="text-gray-500">Loading impact stats...</div>
          ) : impactError ? (
            <div className="text-red-500">{impactError}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                    <stat.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose EcoTrade?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines cutting-edge technology with community-driven sustainability 
              to create the most effective waste exchange ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started with EcoTrade is simple and rewarding.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">List Your Items</h3>
              <p className="text-gray-600">
                Upload photos and details of recyclable materials you want to trade or donate.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect & Chat</h3>
              <p className="text-gray-600">
                Browse listings and connect with traders through our secure messaging system.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trade & Impact</h3>
              <p className="text-gray-600">
                Complete the trade and contribute to a more sustainable community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Our Community
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See what eco-warriors around the world are saying about EcoTrade.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of eco-conscious individuals who are already making a difference 
            in their communities.
          </p>
          {!user && (
            <Link
              to="/auth"
              className="inline-flex items-center bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Start Trading Today
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          )}
        </div>
      </section>
      {showDemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowDemoModal(false)}
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">EcoTrade Demo</h2>
            <div className="w-full aspect-video">
              <iframe
                src="https://photos.app.goo.gl/kgSc2hQ3tiunu4pu9"
                title="EcoTrade Demo"
                className="w-full h-96 rounded"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;