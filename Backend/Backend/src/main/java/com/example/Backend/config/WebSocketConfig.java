package com.example.Backend.config;

import com.example.Backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // /topic for broadcasts, /queue for point-to-point
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages FROM clients
        config.setApplicationDestinationPrefixes("/app");
        // User-specific destination prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Plain WebSocket endpoint (for modern browsers / Vite)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
        // SockJS fallback endpoint
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract JWT token from STOMP headers
                    String token = accessor.getFirstNativeHeader("Authorization");
                    if (token != null && token.startsWith("Bearer ")) {
                        token = token.substring(7);
                    }
                    // Fallback: try "token" header
                    if (token == null || token.isEmpty()) {
                        token = accessor.getFirstNativeHeader("token");
                    }

                    if (token != null && !token.isEmpty()) {
                        try {
                            String email = jwtService.extractUsername(token);
                            if (email != null) {
                                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                                if (jwtService.isTokenValid(token, userDetails)) {
                                    UsernamePasswordAuthenticationToken auth =
                                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                    accessor.setUser(auth);
                                }
                            }
                        } catch (Exception e) {
                            // Invalid token — connection will proceed without auth
                        }
                    }
                }
                return message;
            }
        });
    }
}
