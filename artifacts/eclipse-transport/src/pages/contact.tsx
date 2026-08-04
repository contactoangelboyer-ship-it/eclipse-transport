import { Layout } from "@/components/layout/Layout";
import { useCreateContact } from "@workspace/api-client-react";
import { useState } from "react";
import { Send, MapPin, Phone, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const createContact = useCreateContact();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createContact.mutate({
      data: formData
    }, {
      onSuccess: () => {
        setIsSubmitted(true);
        toast({
          title: "Message Sent",
          description: "We've received your inquiry and will be in touch shortly.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "There was a problem sending your message. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="bg-background min-h-screen pt-12 pb-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Contact Info Panel */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in Touch</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                Have questions about our fleet, specialized services, or corporate accounts? Our concierge team is available to assist you.
              </p>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-primary shrink-0 border border-border">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Phone & WhatsApp</h3>
                    <a href="tel:6263913844" className="text-muted-foreground hover:text-primary transition-colors block mb-1">626-391-3844</a>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Available 24/7 for bookings</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-primary shrink-0 border border-border">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email</h3>
                    <a href="mailto:info@eclipsetransport.com" className="text-muted-foreground hover:text-primary transition-colors block mb-1">info@eclipsetransport.com</a>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Response within 2 hours</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-primary shrink-0 border border-border">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Service Area</h3>
                    <p className="text-muted-foreground">Greater Los Angeles Area</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">LAX, BUR, VNY, LGB Transfers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card border border-border p-8 md:p-10 relative overflow-hidden">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-card z-10 flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Message Received</h3>
                  <p className="text-muted-foreground mb-8">
                    Thank you for contacting Eclipse Transport. A member of our concierge team will respond to your inquiry shortly.
                  </p>
                  <button 
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                    }}
                    className="border border-border hover:bg-background px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : null}

              <h2 className="text-2xl font-bold mb-8">Send an Inquiry</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject</label>
                    <select 
                      id="subject" 
                      name="subject" 
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Corporate Account">Corporate Account</option>
                      <option value="Special Event">Special Event / Wedding</option>
                      <option value="Feedback">Feedback</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={createContact.isPending}
                  className="w-full bg-primary text-primary-foreground px-8 py-4 text-center font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {createContact.isPending ? "Sending..." : "Send Message"} <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
