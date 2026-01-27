import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, Query, Res } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Response } from 'express';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  @ApiOperation({ summary: 'Book tickets for an event' })
  @ApiResponse({ status: 201, description: 'Ticket booking initiated.' })
  @ApiBody({ type: CreateTicketDto })
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    return this.ticketService.create(createTicketDto, req.user.sub);
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get customer tickets' })
  @ApiResponse({ status: 200, description: 'List of customer tickets.' })
  findMyTickets(@Request() req) {
    return this.ticketService.findByCustomer(req.user.sub);
  }

  @Get('reference/:bookingReference')
  @ApiOperation({ summary: 'Find ticket by booking reference' })
  @ApiParam({ name: 'bookingReference', description: 'Booking reference' })
  @ApiResponse({ status: 200, description: 'Ticket found.' })
  findByBookingReference(@Param('bookingReference') bookingReference: string) {
    return this.ticketService.findByBookingReference(bookingReference);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  @ApiResponse({ status: 200, description: 'Email verification result.' })
  async verifyEmail(@Query('token') token: string) {
    return this.ticketService.verifyEmail(token);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate ticket QR code (Staff only)' })
  @ApiResponse({ status: 200, description: 'Ticket validation result.' })
  async validateTicket(@Body() body: { qrData: string }, @Request() req) {
    return this.ticketService.validateTicket(body.qrData, req.user.sub);
  }

  @Post('mercadopago/webhook')
  @ApiOperation({ summary: 'MercadoPago webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed.' })
  async handleMercadoPagoWebhook(@Body() webhookData: any) {
    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data.id;
      const payment = await this.ticketService['mercadoPagoService'].getPayment(paymentId);
      await this.ticketService.processPayment(paymentId, payment.status);
    }
    return { status: 'ok' };
  }

  @Get('payment/success')
  @ApiOperation({ summary: 'Payment success redirect' })
  async paymentSuccess(@Query('payment_id') paymentId: string, @Query('external_reference') externalReference: string, @Res() res: Response) {
    // Process the payment
    const payment = await this.ticketService['mercadoPagoService'].getPayment(paymentId);
    await this.ticketService.processPayment(paymentId, payment.status);
    
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${externalReference}`);
  }

  @Get('payment/failure')
  @ApiOperation({ summary: 'Payment failure redirect' })
  async paymentFailure(@Query('external_reference') externalReference: string, @Res() res: Response) {
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure?reference=${externalReference}`);
  }

  @Get('payment/pending')
  @ApiOperation({ summary: 'Payment pending redirect' })
  async paymentPending(@Query('external_reference') externalReference: string, @Res() res: Response) {
    res.redirect(`${process.env.FRONTEND_URL}/payment/pending?reference=${externalReference}`);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Ticket cancelled.' })
  cancelTicket(@Param('id') id: string, @Request() req) {
    return this.ticketService.cancelTicket(id, req.user.sub);
  }
}
