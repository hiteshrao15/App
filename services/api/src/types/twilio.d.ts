declare module 'twilio' {
  interface TwilioMessages {
    create(options: {
      body: string;
      from: string;
      to: string;
    }): Promise<unknown>;
  }

  interface TwilioClient {
    messages: TwilioMessages;
  }

  const createClient: (accountSid: string, authToken: string) => TwilioClient;
  export default createClient;
}
