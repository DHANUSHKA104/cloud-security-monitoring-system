
package com.cloudsec.monitor.playbook;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaybookService {

    public List<PlaybookStep> getPlaybook(String category) {

        if (category == null) {
            category = "";
        }

        switch (category.toUpperCase()) {

            case "AUTH_ATTACK":
                return List.of(
                    new PlaybookStep(
                        "Review Failed Login Attempts",
                        "Examine authentication logs for repeated failed login attempts, unusual login times, and suspicious source IP addresses."
                    ),
                    new PlaybookStep(
                        "Identify the Affected Account",
                        "Check the account involved in the activity and review available user, device, and login details."
                    ),
                    new PlaybookStep(
                        "Check for Successful Logins",
                        "Determine whether any successful login occurred after repeated failed attempts and identify potentially unauthorized access."
                    ),
                    new PlaybookStep(
                        "Verify Suspicious Activity",
                        "Compare the login activity with expected user behavior and verify unusual activity with the account owner or responsible team."
                    ),
                    new PlaybookStep(
                        "Escalate the Security Incident",
                        "Share the investigation findings with the security analyst for review and approval of appropriate response actions."
                    ),
                    new PlaybookStep(
                        "Document Investigation Results",
                        "Record suspicious IP addresses, affected accounts, timestamps, evidence, and the final investigation status."
                    )
                );

            case "NETWORK_INTRUSION":
                return List.of(
                    new PlaybookStep(
                        "Review Network Security Alerts",
                        "Examine firewall logs, network monitoring alerts, suspicious connections, and unusual traffic patterns."
                    ),
                    new PlaybookStep(
                        "Identify Source and Destination",
                        "Inspect source and destination IP addresses, ports, protocols, and connection timestamps."
                    ),
                    new PlaybookStep(
                        "Identify the Affected Asset",
                        "Determine which server, endpoint, or network resource may be involved in the suspicious activity."
                    ),
                    new PlaybookStep(
                        "Analyze Related Network Events",
                        "Correlate available network logs and related security events to understand the possible scope of the intrusion."
                    ),
                    new PlaybookStep(
                        "Assess Risk and Escalate",
                        "Evaluate the potential impact and share the findings with the security analyst for appropriate response decisions."
                    ),
                    new PlaybookStep(
                        "Document Investigation Results",
                        "Record affected assets, suspicious addresses, observed traffic, collected evidence, and investigation status."
                    )
                );

            default:
                return List.of(
                    new PlaybookStep(
                        "Review Incident Details",
                        "Examine the incident description, category, severity, affected resources, and available security alerts."
                    ),
                    new PlaybookStep(
                        "Collect Supporting Evidence",
                        "Review relevant system logs, timestamps, user activity, and other available security information."
                    ),
                    new PlaybookStep(
                        "Assess Potential Impact",
                        "Identify affected resources and evaluate the possible security impact of the incident."
                    ),
                    new PlaybookStep(
                        "Escalate for Security Review",
                        "Share the collected evidence and investigation findings with the responsible security analyst."
                    ),
                    new PlaybookStep(
                        "Document Investigation Results",
                        "Record the investigation outcome, recommended actions, and current incident status."
                    )
                );
        }
    }
}
